import searchResults from "../../../fixtures/search-results.json";

import {
  filterHolidays,
  getFilterOptions,
  normalizeBookingResponse,
  parseNextSearchParams,
  sortHolidays,
} from "@/domain/holidays";

import type { BookingResponse } from "@/types/booking";

import SearchResultsComponent from "../components/search-results/search-results.component";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

const fixtureResults = searchResults satisfies BookingResponse;

/**
 * Results page owns the complete data pipeline:
 *
 * fixture
 *   → normalization
 *   → filter options
 *   → URL state
 *   → filtering
 *   → sorting
 *   → presentation
 */
export default async function Results({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const holidays = normalizeBookingResponse(fixtureResults);

  const filterOptions = getFilterOptions(holidays);

  const searchState = parseNextSearchParams(params, filterOptions);

  const filteredHolidays = filterHolidays(holidays, searchState.filters);

  const sortedHolidays = sortHolidays(filteredHolidays, searchState.sort);

  return (
    <>
      <h1>Search results</h1>

      <SearchResultsComponent
        // holidays={sortedHolidays}
        // totalHolidays={holidays.length}
        // filterOptions={filterOptions}
        // searchState={searchState}
        searchParams={params}
      />
    </>
  );
}
