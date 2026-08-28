import type {
  HolidayPackageFilters,
  HolidayPackageSearchState,
  HolidayPackageSortOption,
} from "./holiday.types";

/**
 * Query-string keys owned by the holiday results UI.
 */
const SEARCH_PARAM_KEYS = {
  minPrice: "minPrice",
  maxPrice: "maxPrice",
  facilities: "facilities",
  rating: "rating",
  sort: "sort",
} as const;

const DEFAULT_SORT: HolidayPackageSortOption = "recommended";

/**
 * Convert a query-string value into a non-negative finite number.
 *
 * Invalid values are ignored rather than throwing because URLs can
 * be manually edited or shared from an external source.
 */
const parseNonNegativeNumber = (value: string | null): number | undefined => {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return undefined;
  }

  return parsedValue;
};

/**
 * Parse multiple star ratings from the URL.
 *
 * Supported representation:
 *
 * rating=3,4,5
 *
 * Duplicate, invalid and unavailable ratings are ignored.
 */
const parseRatings = (
  value: string | null,
  availableRatings: Set<number>,
): number[] => {
  if (!value) {
    return [];
  }

  const ratings = new Set<number>();

  for (const rating of value.split(",")) {
    const parsedRating = parseNonNegativeNumber(rating.trim());

    if (parsedRating !== undefined && availableRatings.has(parsedRating)) {
      ratings.add(parsedRating);
    }
  }

  return [...ratings].sort((first, second) => first - second);
};

/**
 * Parse and validate the requested sort option.
 *
 * Unknown values fall back to the default.
 */
const parseSort = (value: string | null): HolidayPackageSortOption => {
  if (value === "price" || value === "rating" || value === "recommended") {
    return value;
  }

  return DEFAULT_SORT;
};

/**
 * Normalize a list of facility IDs from the URL.
 *
 * Unknown and duplicate values are removed.
 */
const parseFacilities = (
  value: string | null,
  availableFacilityIds: Set<string>,
): string[] => {
  if (!value) {
    return [];
  }

  const normalizedFacilities = new Set<string>();

  for (const facility of value.split(",")) {
    const facilityId = facility.trim();

    if (facilityId && availableFacilityIds.has(facilityId)) {
      normalizedFacilities.add(facilityId);
    }
  }

  return [...normalizedFacilities].sort();
};

/**
 * Parse the results-related portion of the URL.
 *
 * The parser remains framework-independent and can therefore be
 * tested without React or Next.js.
 */
export const parseHolidaySearchState = (
  searchParams: URLSearchParams,
  options: {
    availableFacilityIds: Set<string>;
    availableRatings: Set<number>;
  },
): HolidayPackageSearchState => {
  const filters: HolidayPackageFilters = {
    minPrice: parseNonNegativeNumber(
      searchParams.get(SEARCH_PARAM_KEYS.minPrice),
    ),

    maxPrice: parseNonNegativeNumber(
      searchParams.get(SEARCH_PARAM_KEYS.maxPrice),
    ),

    facilities: parseFacilities(
      searchParams.get(SEARCH_PARAM_KEYS.facilities),
      options.availableFacilityIds,
    ),

    starRatings: parseRatings(
      searchParams.get(SEARCH_PARAM_KEYS.rating),
      options.availableRatings,
    ),
  };

  return {
    filters,
    sort: parseSort(searchParams.get(SEARCH_PARAM_KEYS.sort)),
  };
};

/**
 * Add a query parameter only when it represents meaningful state.
 */
const setOptionalParam = (
  searchParams: URLSearchParams,
  key: string,
  value: string | undefined,
): void => {
  if (value === undefined || value === "") {
    searchParams.delete(key);
    return;
  }

  searchParams.set(key, value);
};

/**
 * Serialize the holiday search state into URL parameters.
 *
 * Existing unrelated query parameters are preserved.
 */
export const applyHolidaySearchStateToParams = (
  searchParams: URLSearchParams,
  state: HolidayPackageSearchState,
): URLSearchParams => {
  const nextSearchParams = new URLSearchParams(searchParams);

  const { minPrice, maxPrice, facilities, starRatings } = state.filters;

  setOptionalParam(
    nextSearchParams,
    SEARCH_PARAM_KEYS.minPrice,
    minPrice !== undefined ? String(minPrice) : undefined,
  );

  setOptionalParam(
    nextSearchParams,
    SEARCH_PARAM_KEYS.maxPrice,
    maxPrice !== undefined ? String(maxPrice) : undefined,
  );

  const normalizedFacilities = [...new Set(facilities)].sort();

  setOptionalParam(
    nextSearchParams,
    SEARCH_PARAM_KEYS.facilities,
    normalizedFacilities.length > 0
      ? normalizedFacilities.join(",")
      : undefined,
  );

  /**
   * Multiple ratings are serialized in ascending order.
   *
   * Example:
   *
   * [5, 4] → rating=4,5
   */
  const normalizedRatings = [...new Set(starRatings)].sort(
    (first, second) => first - second,
  );

  setOptionalParam(
    nextSearchParams,
    SEARCH_PARAM_KEYS.rating,
    normalizedRatings.length > 0 ? normalizedRatings.join(",") : undefined,
  );

  if (state.sort === DEFAULT_SORT) {
    nextSearchParams.delete(SEARCH_PARAM_KEYS.sort);
  } else {
    nextSearchParams.set(SEARCH_PARAM_KEYS.sort, state.sort);
  }

  return nextSearchParams;
};

/**
 * Build a complete query string from a holiday search state.
 */
export const serializeHolidaySearchState = (
  state: HolidayPackageSearchState,
): string => {
  const params = applyHolidaySearchStateToParams(new URLSearchParams(), state);

  return params.toString();
};
