import { describe, expect, it } from "vitest";

import {
  applyHolidaySearchStateToParams,
  parseHolidaySearchState,
  serializeHolidaySearchState,
} from "../../src/domain/holidays/holiday.search-state";

import type { HolidayPackageSearchState } from "../../src/domain/holidays/holiday.types";

const availableFacilityIds = new Set([
  "free-wifi",
  "gym",
  "kids-club",
  "kitchenette",
  "laundry",
  "parking",
  "pool",
  "restaurant",
  "spa",
]);

const availableRatings = new Set([3, 4, 5]);

const parse = (queryString: string) =>
  parseHolidaySearchState(new URLSearchParams(queryString), {
    availableFacilityIds,
    availableRatings,
  });

const createState = (
  overrides: Partial<HolidayPackageSearchState> = {},
): HolidayPackageSearchState => ({
  filters: {
    facilities: [],
    starRatings: [],
  },
  sort: "recommended",
  ...overrides,
});

describe("parseHolidaySearchState", () => {
  it("returns the default state when no parameters are provided", () => {
    expect(parse("")).toEqual({
      filters: {
        minPrice: undefined,
        maxPrice: undefined,
        facilities: [],
        starRatings: [],
      },
      sort: "recommended",
    });
  });

  it("parses minimum and maximum price", () => {
    expect(parse("minPrice=1000&maxPrice=2000")).toEqual({
      filters: {
        minPrice: 1000,
        maxPrice: 2000,
        facilities: [],
        starRatings: [],
      },
      sort: "recommended",
    });
  });

  it("accepts a minimum price without a maximum price", () => {
    expect(parse("minPrice=1000").filters).toEqual({
      minPrice: 1000,
      maxPrice: undefined,
      facilities: [],
      starRatings: [],
    });
  });

  it("accepts a maximum price without a minimum price", () => {
    expect(parse("maxPrice=2000").filters).toEqual({
      minPrice: undefined,
      maxPrice: 2000,
      facilities: [],
      starRatings: [],
    });
  });

  it("ignores invalid price values", () => {
    expect(parse("minPrice=abc&maxPrice=-100")).toEqual({
      filters: {
        minPrice: undefined,
        maxPrice: undefined,
        facilities: [],
        starRatings: [],
      },
      sort: "recommended",
    });
  });

  it("ignores empty price values", () => {
    expect(parse("minPrice=&maxPrice=")).toEqual({
      filters: {
        minPrice: undefined,
        maxPrice: undefined,
        facilities: [],
        starRatings: [],
      },
      sort: "recommended",
    });
  });

  it("parses multiple ratings", () => {
    expect(parse("rating=3,4,5").filters.starRatings).toEqual([3, 4, 5]);
  });

  it("removes duplicate ratings and sorts them", () => {
    expect(parse("rating=5,3,5,4,3").filters.starRatings).toEqual([3, 4, 5]);
  });

  it("ignores unavailable ratings", () => {
    expect(parse("rating=2,3,6,4").filters.starRatings).toEqual([3, 4]);
  });

  it("ignores invalid rating values", () => {
    expect(parse("rating=abc,4,not-a-rating").filters.starRatings).toEqual([4]);
  });

  it("parses multiple facilities", () => {
    expect(parse("facilities=pool,gym,kids-club").filters.facilities).toEqual([
      "gym",
      "kids-club",
      "pool",
    ]);
  });

  it("removes duplicate facilities and sorts them", () => {
    expect(
      parse("facilities=pool,gym,pool,free-wifi,gym").filters.facilities,
    ).toEqual(["free-wifi", "gym", "pool"]);
  });

  it("ignores unavailable facilities", () => {
    expect(
      parse("facilities=pool,unknown,gym,does-not-exist").filters.facilities,
    ).toEqual(["gym", "pool"]);
  });

  it("parses the supported sort options", () => {
    expect(parse("sort=price").sort).toBe("price");
    expect(parse("sort=rating").sort).toBe("rating");
    expect(parse("sort=recommended").sort).toBe("recommended");
  });

  it("falls back to recommended for an unknown sort value", () => {
    expect(parse("sort=unknown").sort).toBe("recommended");
  });

  it("parses a complete combined search state", () => {
    expect(
      parse(
        "minPrice=1000&maxPrice=2000&rating=3,4&facilities=pool,gym&sort=price",
      ),
    ).toEqual({
      filters: {
        minPrice: 1000,
        maxPrice: 2000,
        facilities: ["gym", "pool"],
        starRatings: [3, 4],
      },
      sort: "price",
    });
  });
});

describe("applyHolidaySearchStateToParams", () => {
  it("adds price filters to existing query parameters", () => {
    const params = new URLSearchParams("foo=bar");

    const result = applyHolidaySearchStateToParams(
      params,
      createState({
        filters: {
          minPrice: 1000,
          maxPrice: 2000,
          facilities: [],
          starRatings: [],
        },
      }),
    );

    expect(result.toString()).toBe("foo=bar&minPrice=1000&maxPrice=2000");
  });

  it("serializes multiple ratings in ascending order", () => {
    const result = applyHolidaySearchStateToParams(
      new URLSearchParams(),
      createState({
        filters: {
          facilities: [],
          starRatings: [5, 3, 4, 5],
        },
      }),
    );

    expect(result.get("rating")).toBe("3,4,5");
  });

  it("serializes multiple facilities in sorted order", () => {
    const result = applyHolidaySearchStateToParams(
      new URLSearchParams(),
      createState({
        filters: {
          facilities: ["pool", "gym", "pool", "free-wifi"],
          starRatings: [],
        },
      }),
    );

    expect(result.get("facilities")).toBe("free-wifi,gym,pool");
  });

  it("removes filter parameters when their values are empty", () => {
    const params = new URLSearchParams(
      "minPrice=1000&maxPrice=2000&rating=3,4&facilities=pool",
    );

    const result = applyHolidaySearchStateToParams(params, createState());

    expect(result.toString()).toBe("");
  });

  it("removes the sort parameter for recommended sorting", () => {
    const params = new URLSearchParams("sort=price");

    const result = applyHolidaySearchStateToParams(
      params,
      createState({
        sort: "recommended",
      }),
    );

    expect(result.has("sort")).toBe(false);
  });

  it("adds a non-default sort parameter", () => {
    const result = applyHolidaySearchStateToParams(
      new URLSearchParams(),
      createState({
        sort: "price",
      }),
    );

    expect(result.get("sort")).toBe("price");
  });

  it("preserves unrelated query parameters", () => {
    const result = applyHolidaySearchStateToParams(
      new URLSearchParams("departure=2026-09-14&location=orlando"),
      createState({
        filters: {
          facilities: ["pool"],
          starRatings: [4],
        },
      }),
    );

    expect(result.get("departure")).toBe("2026-09-14");
    expect(result.get("location")).toBe("orlando");
    expect(result.get("facilities")).toBe("pool");
    expect(result.get("rating")).toBe("4");
  });
});

describe("serializeHolidaySearchState", () => {
  it("creates an empty query string for the default state", () => {
    expect(serializeHolidaySearchState(createState())).toBe("");
  });

  it("serializes the complete search state", () => {
    const state = createState({
      filters: {
        minPrice: 1000,
        maxPrice: 2000,
        facilities: ["pool", "gym"],
        starRatings: [5, 3, 4],
      },
      sort: "price",
    });

    expect(serializeHolidaySearchState(state)).toBe(
      "minPrice=1000&maxPrice=2000&facilities=gym%2Cpool&rating=3%2C4%2C5&sort=price",
    );
  });
});
