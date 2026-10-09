import { seasonLabel } from "./utils";

test("writes seasons the way the site does", () => {
  expect(seasonLabel("2025-2026")).toBe("2025–26");
  expect(seasonLabel("2019–2020")).toBe("2019–20");
  expect(seasonLabel("Fall 2020")).toBe("Fall 2020");
});
