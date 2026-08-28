export type HolidayPackageRating =
  | {
      ratingType: "rated";
      value: number;
    }
  | {
      ratingType: "unrated";
    };

export interface HolidayPackageFacility {
  id: string;
  label: string;
}

export interface HolidayPackageImage {
  url: string;
}

export interface HolidayPackage {
  /**
   * Package-level identity.
   *
   * This must NOT simply be the hotel ID because the same hotel can
   * appear multiple times with different board bases/dates/prices.
   */
  id: string;

  hotel: {
    id: string;
    name: string;
    destination: string;
    propertyType: string;
    boardBasis: string;
    description: string;
    highlights: string[];
    facilities: HolidayPackageFacility[];
    starRating: HolidayPackageRating;
    image: HolidayPackageImage | null;
  };

  pricing: {
    perPerson: number;
    total: number;
  };

  dates: {
    departure: string;
    selected: string;
  };

  rewards: {
    flyingClubMiles: number;
    virginPoints: number;
    tierPoints: number;
  };
}

/**
 * Filters represented by the results page.
 *
 * Price values are optional because an omitted value means
 * "no restriction".
 *
 * Facilities use AND semantics: selecting Pool + Gym means the
 * holiday must provide both facilities.
 *
 * Star ratings use OR semantics: selecting 4 + 5 stars means the
 * holiday can have either a 4-star OR a 5-star rating.
 */
export interface HolidayPackageFilters {
  minPrice?: number;
  maxPrice?: number;
  facilities: string[];
  starRatings: number[];
}

/**
 * Supported result ordering modes.
 */
export type HolidayPackageSortOption = "recommended" | "price" | "rating";

/**
 * Complete search state used by the results domain.
 *
 * URL parsing/serialization maps browser query parameters into
 * this framework-independent representation.
 */
export interface HolidayPackageSearchState {
  filters: HolidayPackageFilters;
  sort: HolidayPackageSortOption;
}

/**
 * Values needed by the filter UI.
 *
 * These are derived from the normalized holiday dataset rather
 * than hard-coded.
 */
export interface HolidayPackageFilterOptions {
  price: {
    min: number;
    max: number;
  };
  facilities: HolidayPackageFacility[];
  starRatings: number[];
}
