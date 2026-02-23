import { defineCollection, z } from "astro:content";

const frameworks = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string().optional(),
      slug: z.string().optional(),
    })
    .passthrough(),
});

export const collections = {
  frameworks,
};
