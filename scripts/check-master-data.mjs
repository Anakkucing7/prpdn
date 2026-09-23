import assert from "node:assert/strict";
import { validateIndicator, validateYear, optionalNumber } from "../src/lib/master-validation.ts";

const indicator = { id: "2", name: "Indikator demo", groupCode: "1-1", groupName: "Pembangunan manusia", unit: "Indeks", baseline: "0,62", target: "0.70", period: "RPJMD", start: "2021", end: "2025" };
assert.deepEqual(validateIndicator(indicator, [1]), {});
assert.ok(validateIndicator(indicator, [2]).id);
assert.ok(validateIndicator({ ...indicator, name: "  ", end: "2020", baseline: "abc" }, []).name);
assert.ok(validateIndicator({ ...indicator, end: "2020" }, []).end);
assert.ok(validateIndicator({ ...indicator, target: "Infinity" }, []).target);
assert.ok(validateIndicator({ ...indicator, start: "" }, []).start);
assert.equal(optionalNumber("0"), 0);
assert.equal(optionalNumber("0,62"), 0.62);
assert.equal(optionalNumber(""), null);
assert.deepEqual(validateYear({ year: "2026", sequence: "6" }, [2021, 2025]), {});
for (const year of ["", "25", "2025.5", "1e3", "0000", "10000"]) assert.ok(validateYear({ year, sequence: "" }, []).year);
assert.ok(validateYear({ year: "2025", sequence: "" }, [2025]).year);
for (const sequence of ["0", "-1", "1.5"]) assert.ok(validateYear({ year: "2026", sequence }, []).sequence);
console.log("Master data validation checks passed");
