import type {
  HolidayPackageFilterOptions,
  HolidayPackageFacility,
  HolidayPackage,
} from "./holiday.types";

/**
 * Derive all filter options from the normalized dataset.
 *
 * Nothing here is hard-coded. If the service returns different
 * prices, facilities, or ratings tomorrow, the filter options
 * automatically adapt.
 */
export const getFilterOptions = (
  holidays: HolidayPackage[],
): HolidayPackageFilterOptions => {
  if (holidays.length === 0) {
    return {
      price: {
        min: 0,
        max: 0,
      },
      facilities: [],
      starRatings: [],
    };
  }

  const prices = holidays.map((holiday) => holiday.pricing.perPerson);

  const facilityMap = new Map<string, HolidayPackageFacility>();
  const starRatings = new Set<number>();

  for (const holiday of holidays) {
    for (const facility of holiday.hotel.facilities) {
      // Map automatically removes duplicate canonical facility IDs.
      if (!facilityMap.has(facility.id)) {
        facilityMap.set(facility.id, facility);
      }
    }

    const rating = holiday.hotel.starRating;

    if (rating.ratingType === "rated") {
      starRatings.add(rating.value);
    }
  }

  return {
    price: {
      min: Math.min(...prices),
      max: Math.max(...prices),
    },

    facilities: [...facilityMap.values()].sort((first, second) =>
      first.label.localeCompare(second.label),
    ),

    starRatings: [...starRatings].sort((first, second) => first - second),
  };
};
