import type { HolidayPackage, HolidayPackageSortOption } from "./holiday.types";

/**
 * Convert a normalized rating into a sortable value.
 *
 * Unrated hotels receive negative infinity so that they appear
 * after every rated hotel when sorting descending.
 *
 * This value is an implementation detail of sorting; the domain
 * model continues to represent unrated as its own explicit state.
 */
const getSortableRating = (holiday: HolidayPackage): number => {
  const rating = holiday.hotel.starRating;

  return rating.ratingType === "rated"
    ? rating.value
    : Number.NEGATIVE_INFINITY;
};

/**
 * Sort holidays according to the requested result ordering.
 *
 * The source array is never mutated.
 *
 * "recommended" deliberately preserves the original fixture/API
 * order because the service does not provide a recommendation score.
 */
export const sortHolidays = (
  holidays: HolidayPackage[],
  sort: HolidayPackageSortOption,
): HolidayPackage[] => {
  if (sort === "recommended") {
    return [...holidays];
  }

  return [...holidays].sort((first, second) => {
    if (sort === "price") {
      return first.pricing.perPerson - second.pricing.perPerson;
    }

    // Rating is sorted from highest to lowest.
    // Returning 0 for equal ratings preserves their source order.
    return getSortableRating(second) - getSortableRating(first);
  });
};
