import { defineConfig } from "vitest/config";

// Unit tests live next to the source they cover, under each package's src/.
export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts"],
    environment: "node",
  },
});
