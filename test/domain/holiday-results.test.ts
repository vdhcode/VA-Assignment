import { describe, expect, it } from "vitest";

import { filterHolidays } from "../../src/domain/holidays/holiday.filters";
import { sortHolidays } from "../../src/domain/holidays/holiday.sort";

import type {
  HolidayPackage,
  HolidayPackageFilters,
} from "../../src/domain/holidays/holiday.types";

/**
 * Build small, representative holiday packages for unit tests.
 *
 * The real fixture contains more fields, but filtering and sorting
 * only depend on price, facilities and star rating. Keeping the
 * test data focused makes the intent of each test obvious.
 */
const createHoliday = ({
  id,
  price,
  rating,
  facilities = [],
}: {
  id: string;
  price: number;
  rating: number | null;
  facilities?: string[];
}): HolidayPackage => ({
  id,

  hotel: {
    id: `hotel-${id}`,
    name: `Hotel ${id}`,
    destination: "Orlando",
    propertyType: "Hotel",
    boardBasis: "Room Only",
    description: "Test holiday package",
    highlights: [],
    facilities: facilities.map((facility) => ({
      id: facility,
      label: facility,
    })),
    starRating:
      rating === null
        ? {
            ratingType: "unrated",
          }
        : {
            ratingType: "rated",
            value: rating,
          },
    image: null,
  },

  pricing: {
    perPerson: price,
    total: price * 2,
  },

  dates: {
    departure: "2026-09-14",
    selected: "2026-09-14",
  },

  rewards: {
    flyingClubMiles: 0,
    virginPoints: 0,
    tierPoints: 0,
  },
});

const holidays: HolidayPackage[] = [
  createHoliday({
    id: "beach-club",
    price: 1199,
    rating: 4,
    facilities: ["pool", "kids-club", "parking"],
  }),

  createHoliday({
    id: "skyline",
    price: 1705,
    rating: 4,
    facilities: ["free-wifi", "restaurant", "gym", "parking"],
  }),

  createHoliday({
    id: "lagoon",
    price: 2560,
    rating: 5,
    facilities: ["pool", "spa", "restaurant", "gym"],
  }),

  createHoliday({
    id: "budget-inn",
    price: 799,
    rating: 3,
    facilities: ["free-wifi"],
  }),

  createHoliday({
    id: "garden-suites",
    price: 1390,
    rating: 4,
    facilities: ["pool", "kitchenette", "laundry", "free-wifi"],
  }),

  createHoliday({
    id: "unrated-beach-club",
    price: 1499,
    rating: null,
    facilities: ["pool", "restaurant", "free-wifi", "kids-club"],
  }),
];

describe("filterHolidays", () => {
  it("returns every holiday when no filters are selected", () => {
    const filters: HolidayPackageFilters = {
      facilities: [],
      starRatings: [],
    };

    const result = filterHolidays(holidays, filters);

    expect(result).toHaveLength(6);
    expect(result.map((holiday) => holiday.id)).toEqual(
      holidays.map((holiday) => holiday.id),
    );
  });

  it("filters holidays by minimum and maximum price", () => {
    const filters: HolidayPackageFilters = {
      minPrice: 1000,
      maxPrice: 1500,
      facilities: [],
      starRatings: [],
    };

    const result = filterHolidays(holidays, filters);

    expect(result.map((holiday) => holiday.id)).toEqual([
      "beach-club",
      "garden-suites",
      "unrated-beach-club",
    ]);
  });

  it("supports a minimum price without a maximum price", () => {
    const filters: HolidayPackageFilters = {
      minPrice: 1700,
      facilities: [],
      starRatings: [],
    };

    const result = filterHolidays(holidays, filters);

    expect(result.map((holiday) => holiday.id)).toEqual(["skyline", "lagoon"]);
  });

  it("supports a maximum price without a minimum price", () => {
    const filters: HolidayPackageFilters = {
      maxPrice: 1200,
      facilities: [],
      starRatings: [],
    };

    const result = filterHolidays(holidays, filters);

    expect(result.map((holiday) => holiday.id)).toEqual([
      "beach-club",
      "budget-inn",
    ]);
  });

  it("uses OR semantics when multiple star ratings are selected", () => {
    const filters: HolidayPackageFilters = {
      facilities: [],
      starRatings: [3, 5],
    };

    const result = filterHolidays(holidays, filters);

    expect(result.map((holiday) => holiday.id)).toEqual([
      "lagoon",
      "budget-inn",
    ]);
  });

  it("does not match an unrated hotel against numeric ratings", () => {
    const filters: HolidayPackageFilters = {
      facilities: [],
      starRatings: [4, 5],
    };

    const result = filterHolidays(holidays, filters);

    expect(result.map((holiday) => holiday.id)).toEqual([
      "beach-club",
      "skyline",
      "lagoon",
      "garden-suites",
    ]);
  });

  it("uses AND semantics for multiple facilities", () => {
    const filters: HolidayPackageFilters = {
      facilities: ["pool", "kids-club"],
      starRatings: [],
    };

    const result = filterHolidays(holidays, filters);

    expect(result.map((holiday) => holiday.id)).toEqual([
      "beach-club",
      "unrated-beach-club",
    ]);
  });

  it("requires every selected facility to be present", () => {
    const filters: HolidayPackageFilters = {
      facilities: ["pool", "gym"],
      starRatings: [],
    };

    const result = filterHolidays(holidays, filters);

    expect(result.map((holiday) => holiday.id)).toEqual(["lagoon"]);
  });

  it("combines price, rating and facility filters", () => {
    const filters: HolidayPackageFilters = {
      minPrice: 1000,
      maxPrice: 2000,
      starRatings: [4],
      facilities: ["free-wifi"],
    };

    const result = filterHolidays(holidays, filters);

    expect(result.map((holiday) => holiday.id)).toEqual([
      "skyline",
      "garden-suites",
    ]);
  });

  it("does not mutate the source array", () => {
    const original = [...holidays];

    const filters: HolidayPackageFilters = {
      minPrice: 1000,
      facilities: [],
      starRatings: [],
    };

    filterHolidays(holidays, filters);

    expect(holidays).toEqual(original);
  });
});

describe("sortHolidays", () => {
  it("preserves fixture order for recommended sorting", () => {
    const result = sortHolidays(holidays, "recommended");

    expect(result.map((holiday) => holiday.id)).toEqual(
      holidays.map((holiday) => holiday.id),
    );
  });

  it("sorts by price from low to high", () => {
    const result = sortHolidays(holidays, "price");

    expect(result.map((holiday) => holiday.id)).toEqual([
      "budget-inn",
      "beach-club",
      "garden-suites",
      "unrated-beach-club",
      "skyline",
      "lagoon",
    ]);
  });

  it("sorts by rating from high to low", () => {
    const result = sortHolidays(holidays, "rating");

    expect(result.map((holiday) => holiday.id)).toEqual([
      "lagoon",
      "beach-club",
      "skyline",
      "garden-suites",
      "budget-inn",
      "unrated-beach-club",
    ]);
  });

  it("places unrated holidays after rated holidays", () => {
    const result = sortHolidays(
      [holidays[5], holidays[0], holidays[2]],
      "rating",
    );

    expect(result.map((holiday) => holiday.id)).toEqual([
      "lagoon",
      "beach-club",
      "unrated-beach-club",
    ]);
  });

  it("does not mutate the source array", () => {
    const original = [...holidays];

    sortHolidays(holidays, "price");
    sortHolidays(holidays, "rating");

    expect(holidays).toEqual(original);
  });
});
