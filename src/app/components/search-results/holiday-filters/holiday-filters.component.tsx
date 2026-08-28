"use client";

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  HolidayPackageFilterOptions,
  HolidayPackageSearchState,
} from "@/domain/holidays";

import styles from "./holiday-filters.module.css";

interface HolidayFiltersProps {
  filterOptions: HolidayPackageFilterOptions;
  searchState: HolidayPackageSearchState;
}

interface PriceRange {
  min: number;
  max: number;
}

/**
 * Keeps a value inside the available fixture price bounds.
 */
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Converts a price value into a percentage position on the slider track.
 */
const getPercentage = (value: number, min: number, max: number): number => {
  if (max === min) {
    return 0;
  }

  return ((value - min) / (max - min)) * 100;
};

/**
 * The sidebar contains all customer-facing filters.
 *
 * Price uses a local two-ended slider so moving a handle does not
 * immediately update the URL. The URL is committed when the user
 * releases the handle.
 *
 * Star ratings and facilities remain multi-select filters.
 */
export function HolidayFilters({
  filterOptions,
  searchState,
}: HolidayFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { min: minimumPrice, max: maximumPrice } = filterOptions.price;

  const initialMin = searchState.filters.minPrice ?? minimumPrice;

  const initialMax = searchState.filters.maxPrice ?? maximumPrice;

  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: initialMin,
    max: initialMax,
  });

  const [priceInputs, setPriceInputs] = useState<PriceRange>({
    min: initialMin,
    max: initialMax,
  });

  /**
   * Updates the URL while preserving all existing search criteria.
   *
   * For example, changing the price must not remove:
   *
   * ?location=orlando&departureDate=2026-10-04&rating=3,4&facilities=pool
   */
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  /**
   * Commits a complete price range.
   *
   * The values are normalized before being written to the URL so
   * malformed or reversed input cannot create an invalid range.
   */
  const commitPriceRange = (nextRange: PriceRange) => {
    const boundedMin = clamp(nextRange.min, minimumPrice, maximumPrice);

    const boundedMax = clamp(nextRange.max, minimumPrice, maximumPrice);

    const committedMin = Math.min(boundedMin, boundedMax);

    const committedMax = Math.max(boundedMin, boundedMax);

    const normalizedRange = {
      min: committedMin,
      max: committedMax,
    };

    setPriceRange(normalizedRange);
    setPriceInputs(normalizedRange);

    updateUrl({
      minPrice: committedMin === minimumPrice ? null : String(committedMin),

      maxPrice: committedMax === maximumPrice ? null : String(committedMax),
    });
  };

  /**
   * The minimum slider only updates local state while dragging.
   */
  const handleMinSliderChange = (value: number) => {
    setPriceRange((current) => ({
      min: Math.min(value, current.max),
      max: current.max,
    }));
  };

  /**
   * The maximum slider only updates local state while dragging.
   */
  const handleMaxSliderChange = (value: number) => {
    setPriceRange((current) => ({
      min: current.min,
      max: Math.max(value, current.min),
    }));
  };

  /**
   * URL update happens only after the user releases the handle.
   */
  const handleMinSliderCommit = () => {
    commitPriceRange(priceRange);
  };

  const handleMaxSliderCommit = () => {
    commitPriceRange(priceRange);
  };

  /**
   * Keyboard users should get the same behaviour as pointer users.
   * Arrow keys move the slider, while releasing the interaction
   * commits the final value.
   */
  const handleSliderKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key.startsWith("Arrow") ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      commitPriceRange(priceRange);
    }
  };

  /**
   * Text fields update local state while typing.
   * The URL is updated on blur or Enter.
   */
  const handlePriceInputChange = (field: keyof PriceRange, value: string) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    setPriceInputs((current) => ({
      ...current,
      [field]: numericValue,
    }));
  };

  const handlePriceInputCommit = () => {
    commitPriceRange(priceInputs);
  };

  const handlePriceInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  /**
   * Rating is deliberately a multi-select.
   *
   * Selecting 4 and 3 stars therefore produces:
   * rating=3,4
   */
  const handleRatingChange = (rating: number, checked: boolean) => {
    const currentRatings = searchState.filters.starRatings;

    const nextRatings = checked
      ? [...currentRatings, rating]
      : currentRatings.filter((currentRating) => currentRating !== rating);

    const uniqueRatings = [...new Set(nextRatings)].sort(
      (first, second) => first - second,
    );

    updateUrl({
      rating: uniqueRatings.length > 0 ? uniqueRatings.join(",") : null,
    });
  };

  /**
   * Facilities are also multi-select.
   */
  const handleFacilityChange = (facilityId: string, checked: boolean) => {
    const currentFacilities = searchState.filters.facilities;

    const nextFacilities = checked
      ? [...currentFacilities, facilityId]
      : currentFacilities.filter((facility) => facility !== facilityId);

    const uniqueFacilities = [...new Set(nextFacilities)].sort();

    updateUrl({
      facilities:
        uniqueFacilities.length > 0 ? uniqueFacilities.join(",") : null,
    });
  };

  const handleClear = () => {
    updateUrl({
      minPrice: null,
      maxPrice: null,
      rating: null,
      facilities: null,
    });
  };

  const hasActiveFilters =
    searchState.filters.minPrice !== undefined ||
    searchState.filters.maxPrice !== undefined ||
    searchState.filters.starRatings.length > 0 ||
    searchState.filters.facilities.length > 0;

  const minPercentage = getPercentage(
    priceRange.min,
    minimumPrice,
    maximumPrice,
  );

  const maxPercentage = getPercentage(
    priceRange.max,
    minimumPrice,
    maximumPrice,
  );

  return (
    <aside className={styles.panel} aria-labelledby="holiday-filters-heading">
      <div className={styles.header}>
        <div>
          <h2 id="holiday-filters-heading">Filters</h2>

          {hasActiveFilters && (
            <p className={styles.activeSummary}>Active filters</p>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Price range */}
      <fieldset className={styles.group}>
        <legend>Price per person</legend>

        <div className={styles.rangeBounds}>
          <span>£{minimumPrice.toLocaleString("en-GB")}</span>

          <span>£{maximumPrice.toLocaleString("en-GB")}</span>
        </div>

        <div className={styles.slider}>
          <div className={styles.sliderTrack} aria-hidden="true" />

          {/*
           * SVG is used only as the visual range overlay. Its position is
           * driven by SVG attributes rather than inline CSS, keeping all
           * visual styling inside the CSS module.
           */}
          <svg
            className={styles.sliderSelected}
            viewBox="0 0 100 22"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              x1={minPercentage}
              x2={maxPercentage}
              y1="11"
              y2="11"
              className={styles.sliderSelectedLine}
            />
          </svg>

          <input
            className={styles.rangeInput}
            type="range"
            min={minimumPrice}
            max={maximumPrice}
            value={priceRange.min}
            aria-label="Minimum price per person"
            disabled={minimumPrice >= maximumPrice}
            onChange={(event) =>
              handleMinSliderChange(Number(event.target.value))
            }
            onPointerUp={handleMinSliderCommit}
            onKeyUp={handleSliderKeyUp}
          />

          <input
            className={styles.rangeInput}
            type="range"
            min={minimumPrice}
            max={maximumPrice}
            value={priceRange.max}
            aria-label="Maximum price per person"
            disabled={minimumPrice >= maximumPrice}
            onChange={(event) =>
              handleMaxSliderChange(Number(event.target.value))
            }
            onPointerUp={handleMaxSliderCommit}
            onKeyUp={handleSliderKeyUp}
          />
        </div>

        <div className={styles.priceInputs}>
          <label>
            <span>From</span>

            <input
              type="number"
              min={minimumPrice}
              max={maximumPrice}
              value={priceInputs.min}
              onChange={(event) =>
                handlePriceInputChange("min", event.target.value)
              }
              onBlur={handlePriceInputCommit}
              onKeyDown={handlePriceInputKeyDown}
            />
          </label>

          <label>
            <span>To</span>

            <input
              type="number"
              min={minimumPrice}
              max={maximumPrice}
              value={priceInputs.max}
              onChange={(event) =>
                handlePriceInputChange("max", event.target.value)
              }
              onBlur={handlePriceInputCommit}
              onKeyDown={handlePriceInputKeyDown}
            />
          </label>
        </div>
      </fieldset>

      {/* Star rating */}
      {filterOptions.starRatings.length > 0 && (
        <fieldset className={styles.group}>
          <legend>Star rating</legend>

          <div className={styles.options}>
            {[...filterOptions.starRatings]
              .sort((first, second) => second - first)
              .map((rating) => {
                const checked =
                  searchState.filters.starRatings.includes(rating);

                return (
                  <label key={rating} className={styles.option}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        handleRatingChange(rating, event.target.checked)
                      }
                    />

                    <span className={styles.checkbox} aria-hidden="true" />

                    <span className={styles.stars} aria-hidden="true">
                      {"★".repeat(Math.round(rating))}
                    </span>

                    <span>{rating} stars</span>
                  </label>
                );
              })}
          </div>
        </fieldset>
      )}

      {/* Facilities */}
      {filterOptions.facilities.length > 0 && (
        <fieldset className={styles.group}>
          <legend>Facilities</legend>

          <div className={styles.options}>
            {filterOptions.facilities.map((facility) => {
              const checked = searchState.filters.facilities.includes(
                facility.id,
              );

              return (
                <label key={facility.id} className={styles.option}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      handleFacilityChange(facility.id, event.target.checked)
                    }
                  />

                  <span className={styles.checkbox} aria-hidden="true" />

                  <span>{facility.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </aside>
  );
}
