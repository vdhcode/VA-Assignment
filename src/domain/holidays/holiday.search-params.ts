import type {
  HolidayPackageFilterOptions,
  HolidayPackageSearchState,
} from "./holiday.types";

import { parseHolidaySearchState } from "./holiday.search-state";

/**
 * Convert the framework-specific search parameter representation
 * used by the Next.js page into the standard URLSearchParams type
 * consumed by the domain parser.
 *
 * Keeping this adapter outside the parser means the actual URL-state
 * logic remains independent of Next.js.
 */
export const parseNextSearchParams = (
  searchParams: Record<string, string | string[] | undefined>,
  filterOptions: HolidayPackageFilterOptions,
): HolidayPackageSearchState => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }

    /**
     * Next.js can represent a query parameter as a string or
     * an array of strings. For our results parameters, the first
     * value is sufficient because each parameter has one canonical
     * representation.
     */
    params.set(key, Array.isArray(value) ? (value[0] ?? "") : value);
  }

  return parseHolidaySearchState(params, {
    availableFacilityIds: new Set(
      filterOptions.facilities.map((facility) => facility.id),
    ),
    availableRatings: new Set(filterOptions.starRatings),
  });
};
