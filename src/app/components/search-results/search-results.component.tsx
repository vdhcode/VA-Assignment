import type {
  HolidayPackageFilterOptions,
  HolidayPackage,
  HolidayPackageSearchState,
} from "@/domain/holidays";

import { HolidayCard } from "./holiday-card/holiday-card.component";
import { HolidayFilters } from "./holiday-filters/holiday-filters.component";
import { SortResults } from "./sort-results/sort-results.component";

import styles from "./search-results.module.css";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

interface SearchResultsComponentProps {
  holidays: HolidayPackage[];
  totalHolidays: number;
  filterOptions: HolidayPackageFilterOptions;
  searchState: HolidayPackageSearchState;
  searchParams: SearchParams;
}

const getSingleParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

export default function SearchResultsComponent({
  holidays,
  totalHolidays,
  filterOptions,
  searchState,
  searchParams,
}: SearchResultsComponentProps) {
  const location = getSingleParam(searchParams.location);
  const departureDate = getSingleParam(searchParams.departureDate);

  return (
    <section className={styles.container}>
      {(location || departureDate) && (
        <p className={styles.searchSummary}>
          Showing results
          {location ? ` for ${location}` : ""}
          {departureDate ? ` departing ${departureDate}` : ""}.
        </p>
      )}

      <div className={styles.layout}>
        {/* LEFT: complete filter panel */}
        <HolidayFilters
          key={`${searchState.filters.minPrice ?? filterOptions.price.min}-${searchState.filters.maxPrice ?? filterOptions.price.max}`}
          filterOptions={filterOptions}
          searchState={searchState}
        />

        {/* RIGHT: results */}
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultCount} aria-live="polite">
              {holidays.length} of {totalHolidays} holidays shown
            </p>

            <SortResults value={searchState.sort} />
          </div>

          {holidays.length > 0 ? (
            <div className={styles.resultsList}>
              {holidays.map((holiday) => (
                <HolidayCard key={holiday.id} holiday={holiday} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>No holidays found</h2>
              <p>No holidays match your current search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
