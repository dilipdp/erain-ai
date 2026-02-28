import type { APIRoute } from "astro";
import { requireAdminApiAccess } from "../../../../lib/admin-api";
import {
  getGateStatusMap,
  listWeeklyMetrics,
  safeString,
} from "../../../../lib/intake-service";

export const prerender = false;

const requiredGateOrder = ["p7", "p8", "p9", "p10", "p11", "p12"];

function normalizeGateStatus(raw: string): "pass" | "fail" | "attention" | "unknown" {
  const status = safeString(raw, 40).toLowerCase();
  if (status === "pass" || status === "go") return "pass";
  if (status === "fail" || status === "no-go" || status === "no_go") return "fail";
  if (status === "attention" || status === "go_with_actions" || status === "warn" || status === "warning") {
    return "attention";
  }
  return "unknown";
}

function gateEntry(
  gateMap: Record<string, { status: string; checked_at_utc: string; hard_fail: number }>,
  gateName: string,
): {
  gate: string;
  status: "pass" | "fail" | "attention" | "unknown";
  hard_fail: boolean;
  checked_at_utc: string;
} {
  const row = gateMap[gateName];
  return {
    gate: gateName,
    status: normalizeGateStatus(row?.status || "unknown"),
    hard_fail: Boolean(row?.hard_fail),
    checked_at_utc: safeString(row?.checked_at_utc, 80),
  };
}

export const GET: APIRoute = async (context) => {
  const denied = requireAdminApiAccess(context);
  if (denied) return denied;

  const weekStartIso = safeString(context.url.searchParams.get("week_start_iso"), 32);
  const metrics = await listWeeklyMetrics(context, weekStartIso || undefined);
  const gateMap = await getGateStatusMap(context, [...requiredGateOrder, "p13"]);

  const gateStatusList = requiredGateOrder.map((name) => gateEntry(gateMap, name));
  const p13 = gateEntry(gateMap, "p13");

  const hardFailGate = gateStatusList.find((g) => g.gate === "p11" || g.gate === "p12")?.status === "fail" ||
    gateStatusList.some((g) => (g.gate === "p11" || g.gate === "p12") && (g.hard_fail || g.status === "fail"));

  const anyFail = gateStatusList.some((g) => g.status === "fail") || p13.status === "fail";
  const anyAttention = gateStatusList.some((g) => g.status === "attention" || g.status === "unknown") || p13.status === "attention";

  let decision: "go" | "go_with_actions" | "no_go" = "go";
  if (hardFailGate || anyFail) {
    decision = "no_go";
  } else if (anyAttention) {
    decision = "go_with_actions";
  }

  const actions: string[] = [];
  if (hardFailGate) {
    actions.push("Resolve p11/p12 hard failure before any release decision.");
  }
  if (Number(metrics.reference_call_close_rate_percent ?? 0) < 35) {
    actions.push("Reference-call close rate below 35%; correct proof-led commercial motion.");
  }
  if (Number(metrics.p50_time_to_value_days ?? 99) > 18) {
    actions.push("P50 time-to-value above 18 days; compress delivery cadence.");
  }
  if (Number(metrics.case_studies_named ?? 0) < 2) {
    actions.push("Named case-study inventory below target; push legal approvals.");
  }

  return Response.json(
    {
      generated_at_utc: new Date().toISOString(),
      decision,
      week_start_iso: (metrics.week_start_iso ?? weekStartIso) || null,
      scoreboard: metrics,
      gates: {
        required: gateStatusList,
        control_tower: p13,
      },
      go_no_go_reasoning: {
        hard_fail_gate: hardFailGate,
        any_fail,
        any_attention,
      },
      top_corrective_actions: actions.slice(0, 5),
    },
    {
      status: 200,
    },
  );
};
