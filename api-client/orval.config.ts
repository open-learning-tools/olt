import { defineConfig } from "orval";

const schemaTarget = process.env.OPENAPI_SCHEMA ?? "./openapi.json";

export default defineConfig({
  api: {
    input: {
      target: schemaTarget,
    },
    output: {
      mode: "single",
      target: "src/generated/openLearningTools.ts",
      schemas: "src/generated/models",
      client: "fetch",
      clean: true,
      override: {
        mutator: {
          path: "src/fetch-client.ts",
          name: "openLearningToolsFetch",
        },
      },
    },
  },
});
