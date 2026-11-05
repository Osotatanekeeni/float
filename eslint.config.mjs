import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Invariant 2: the engine is pure and deterministic, identical in browser and server.
    files: ["packages/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["react", "react-*", "next", "next/*", "node:*", "@/*"] },
      ],
      "no-restricted-properties": [
        "error",
        { object: "Date", property: "now", message: "Pass the clock in; the engine must be pure." },
        { object: "Math", property: "random", message: "The engine must be deterministic." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Pass the clock in; the engine must be pure.",
        },
      ],
    },
  },
  {
    // ADR 0003: the owner connection bypasses row-level security, so request code must not import it.
    files: ["src/app/**/*.{ts,tsx}", "src/db/repos/**/*.ts", "src/server/users.ts"],
    ignores: ["src/app/sign-in/actions.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/db/admin"], message: "Request code uses withUser(getAppDb()); the owner connection is for Auth.js and jobs only." }] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
