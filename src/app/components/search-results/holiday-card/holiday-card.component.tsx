import type { HolidayPackage } from "@/domain/holidays";

import { HolidayImage } from "./holiday-image.component";

import styles from "./holiday-card.module.css";

interface HolidayCardProps {
  holiday: HolidayPackage;
}

const MAX_VISIBLE_FACILITIES = 4;

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

/**
 * Displays one holiday package.
 *
 * This component is intentionally presentation-focused. Filtering,
 * sorting and URL state are handled outside the card.
 */
export function HolidayCard({ holiday }: HolidayCardProps) {
  const { hotel, pricing, dates } = holiday;

  const visibleFacilities = hotel.facilities.slice(0, MAX_VISIBLE_FACILITIES);

  const hiddenFacilityCount = Math.max(
    hotel.facilities.length - visibleFacilities.length,
    0,
  );

  const rating =
    hotel.starRating.ratingType === "rated" ? hotel.starRating.value : null;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <HolidayImage src={hotel.image?.url ?? undefined} alt={hotel.name} />

        <span
          className={styles.ratingBadge}
          aria-label={
            rating !== null
              ? `${rating} star rating`
              : "Hotel rating unavailable"
          }
        >
          ★ {rating !== null ? rating : "–"}
        </span>
      </div>

      <div className={styles.body}>
        <header className={styles.cardHeader}>
          <p className={styles.location}>{hotel.destination}</p>

          <h3 className={styles.hotelName}>{hotel.name}</h3>
        </header>

        <dl className={styles.metaGrid}>
          <div>
            <dt>Board basis</dt>

            <dd>{hotel.boardBasis}</dd>
          </div>

          <div>
            <dt>Departs</dt>

            <dd>{dates.departure}</dd>
          </div>
        </dl>

        {hotel.highlights.length > 0 && (
          <ul className={styles.highlights}>
            {hotel.highlights.slice(0, 3).map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        )}

        {visibleFacilities.length > 0 ? (
          <ul className={styles.facilities} aria-label="Facilities">
            {visibleFacilities.map((facility) => (
              <li key={facility.id} className={styles.facilityChip}>
                {facility.label}
              </li>
            ))}

            {hiddenFacilityCount > 0 && (
              <li
                className={styles.facilityChip}
                aria-label={`${hiddenFacilityCount} more facilities`}
              >
                +{hiddenFacilityCount} more
              </li>
            )}
          </ul>
        ) : (
          <p className={styles.noFacilities}>
            Facility information not available
          </p>
        )}

        <footer className={styles.priceRow}>
          <div>
            <p className={styles.pricePerPerson}>
              {currency.format(pricing.perPerson)} <span>per person</span>
            </p>

            <p className={styles.totalPrice}>
              {currency.format(pricing.total)} total
            </p>
          </div>
        </footer>
      </div>
    </article>
  );
}
