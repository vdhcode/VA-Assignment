import type { HolidayPackage, HolidayPackageFilters } from "./holiday.types";

/**
 * Match the holiday price against the optional price boundaries.
 */
const matchesPrice = (
  holiday: HolidayPackage,
  minPrice?: number,
  maxPrice?: number,
): boolean => {
  const price = holiday.pricing.perPerson;

  if (minPrice !== undefined && price < minPrice) {
    return false;
  }

  if (maxPrice !== undefined && price > maxPrice) {
    return false;
  }

  return true;
};

/**
 * Match selected facilities using AND semantics.
 *
 * For example:
 *
 * facilities = ["pool", "gym"]
 *
 * means the holiday must contain BOTH Pool and Gym.
 */
const matchesFacilities = (
  holiday: HolidayPackage,
  selectedFacilities: string[],
): boolean => {
  if (selectedFacilities.length === 0) {
    return true;
  }

  const availableFacilityIds = new Set(
    holiday.hotel.facilities.map((facility) => facility.id),
  );

  return selectedFacilities.every((facilityId) =>
    availableFacilityIds.has(facilityId),
  );
};

/**
 * Match selected star ratings using OR semantics.
 *
 * For example:
 *
 * starRatings = [4, 5]
 *
 * matches:
 *   4-star hotels
 *   5-star hotels
 *
 * It does not match:
 *   3-star hotels
 *   unrated hotels
 *
 * "Unrated" intentionally remains a separate display state and
 * cannot accidentally match a numeric rating filter.
 */
const matchesStarRatings = (
  holiday: HolidayPackage,
  selectedRatings: number[],
): boolean => {
  if (selectedRatings.length === 0) {
    return true;
  }

  const rating = holiday.hotel.starRating;

  if (rating.ratingType !== "rated") {
    return false;
  }

  return selectedRatings.includes(rating.value);
};

/**
 * Determine whether one holiday satisfies every active filter.
 *
 * Different filter categories use AND semantics:
 *
 * price
 *   AND facilities
 *   AND star rating
 *
 * Within the star-rating category, selected ratings use OR semantics.
 */
export const matchesFilters = (
  holiday: HolidayPackage,
  filters: HolidayPackageFilters,
): boolean => {
  return (
    matchesPrice(holiday, filters.minPrice, filters.maxPrice) &&
    matchesFacilities(holiday, filters.facilities) &&
    matchesStarRatings(holiday, filters.starRatings)
  );
};

/**
 * Apply all filters without mutating the original dataset.
 */
export const filterHolidays = (
  holidays: HolidayPackage[],
  filters: HolidayPackageFilters,
): HolidayPackage[] => {
  return holidays.filter((holiday) => matchesFilters(holiday, filters));
};
