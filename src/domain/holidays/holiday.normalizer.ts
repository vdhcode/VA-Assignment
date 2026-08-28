import type { BookingResponse, Holiday } from "@/types/booking";

import type {
  HolidayPackageFacility,
  HolidayPackageImage,
  HolidayPackage,
  HolidayPackageRating,
} from "./holiday.types";

/**
 * Normalize holiday package facility.
 */
const normalizeComparisonValue = (value: string): string => {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
};

/**
 * Format the label to display and filter
 */
const createStableId = (value: string): string => {
  return normalizeComparisonValue(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Normalize a raw rating.
 *
 * The external service can provide:
 * - numbers
 * - numeric strings
 * - "Unrated"
 *
 * Invalid values are treated as unrated rather than allowing
 * malformed data to leak into the application.
 */
export const normalizeRating = (
  value: number | string,
): HolidayPackageRating => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0
      ? {
          ratingType: "rated",
          value,
        }
      : {
          ratingType: "unrated",
        };
  }

  const normalizedValue = value.trim();

  if (normalizedValue.toLowerCase() === "unrated") {
    return {
      ratingType: "unrated",
    };
  }

  const numericValue = Number(normalizedValue);

  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return {
      ratingType: "rated",
      value: numericValue,
    };
  }

  return {
    ratingType: "unrated",
  };
};

/**
 * Normalize a facility into the application's canonical form.
 *
 * The ID is deliberately independent from display casing, allowing:
 *
 * "Free WiFi"
 * "free wifi"
 * " FREE   WIFI "
 *
 * to represent the same filter option.
 */
export const normalizeFacility = (
  value: string,
): HolidayPackageFacility | null => {
  const label = value.trim();

  if (!label) {
    return null;
  }

  const id = createStableId(label);

  if (!id) {
    return null;
  }

  return {
    id,
    label,
  };
};

/**
 * Normalize all facilities on a hotel while preserving their first
 * meaningful display label and source ordering.
 */
export const normalizeFacilities = (
  facilities: string[],
): HolidayPackageFacility[] => {
  const seen = new Set<string>();
  const normalizedFacilities: HolidayPackageFacility[] = [];

  for (const facility of facilities) {
    const normalizedFacility = normalizeFacility(facility);

    if (!normalizedFacility || seen.has(normalizedFacility.id)) {
      continue;
    }

    seen.add(normalizedFacility.id);
    normalizedFacilities.push(normalizedFacility);
  }

  return normalizedFacilities;
};

/**
 * Extract the result-card image from the service-specific image
 * structure.
 *
 * The API represents an image as:
 *
 * images[0].RESULTS_CAROUSEL.url
 *
 * The application should not need to know that shape after
 * normalization.
 */
export const normalizeImage = (
  holiday: Holiday,
): HolidayPackageImage | null => {
  const imageUrl = holiday.hotel.content.images[0]?.RESULTS_CAROUSEL?.url;

  if (!imageUrl) {
    return null;
  }

  return {
    url: imageUrl,
  };
};

/**
 * Create a stable package identifier.
 *
 * Hotel IDs are NOT unique at package level. The fixture intentionally
 * contains the same hotel returned with different board bases and
 * selected dates.
 *
 * We therefore combine stable package attributes rather than
 * deduplicating by hotel ID.
 */
const createPackageId = (holiday: Holiday): string => {
  const parts = [
    holiday.hotel.id,
    holiday.hotel.boardBasis,
    holiday.departureDate,
    holiday.selectedDate,
    holiday.pricePerPerson,
  ];

  return parts.map((part) => String(part).trim().toLowerCase()).join("|");
};

/**
 * Normalize one raw holiday package into the domain model.
 */
export const normalizeHoliday = (holiday: Holiday): HolidayPackage => {
  const content = holiday.hotel.content;

  return {
    id: createPackageId(holiday),

    hotel: {
      id: holiday.hotel.id,
      name: holiday.hotel.name,
      destination: content.parentLocation,
      propertyType: content.propertyType,
      boardBasis: holiday.hotel.boardBasis,
      description: content.hotelDescription,
      highlights: [...content.atAGlance],
      facilities: normalizeFacilities(content.hotelFacilities),
      starRating: normalizeRating(content.starRating),
      image: normalizeImage(holiday),
    },

    pricing: {
      perPerson: holiday.pricePerPerson,
      total: holiday.totalPrice,
    },

    dates: {
      departure: holiday.departureDate,
      selected: holiday.selectedDate,
    },

    rewards: {
      flyingClubMiles: holiday.flyingClubMiles,
      virginPoints: holiday.virginPoints,
      tierPoints: holiday.tierPoints,
    },
  };
};

/**
 * Normalize the complete service response.
 *
 * We deliberately preserve the source array order because that
 * order becomes the meaning of our "recommended" sort option.
 */
export const normalizeBookingResponse = (
  response: BookingResponse,
): HolidayPackage[] => {
  return response.holidays.map(normalizeHoliday);
};
