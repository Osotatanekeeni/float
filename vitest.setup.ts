import fc from "fast-check";

// The PRD asks for engine properties over thousands of random cases.
fc.configureGlobal({ numRuns: 1000 });
