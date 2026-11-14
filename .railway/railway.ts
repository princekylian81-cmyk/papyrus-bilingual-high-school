import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "api";
export default defineRailway(() => {
  const api = service("api", {
    source: github("princekylian81-cmyk/papyrus-bilingual-high-school"),
    build: { buildEnvironment: "V3", builder: "RAILPACK" },
    healthcheck: "/api/health",
    healthcheckTimeout: 300,
    preDeploy: "npm run db:migrate",
    replicas: { "iad": 1 },
  });

  return project("perfect-prosperity", {
    variables: { managed: false },
    resources: [api],
  });
});
