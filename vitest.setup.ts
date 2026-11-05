import fc from "fast-check";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);
afterEach(() => cleanup());

// The PRD asks for engine properties over thousands of random cases.
fc.configureGlobal({ numRuns: 1000 });
