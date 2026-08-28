"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { HolidayPackageSortOption } from "@/domain/holidays";

import styles from "./sort-results.module.css";

interface SortResultsProps {
  value: HolidayPackageSortOption;
}

const SORT_OPTIONS: Array<{
  value: HolidayPackageSortOption;
  label: string;
}> = [
  {
    value: "recommended",
    label: "Recommended",
  },
  {
    value: "price",
    label: "Price: Low to high",
  },
  {
    value: "rating",
    label: "Rating: High to low",
  },
];

/**
 * Sort control for the results toolbar.
 *
 * Changing sort preserves all existing filter/search parameters.
 */
export function SortResults({ value }: SortResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const handleChange = (nextSort: HolidayPackageSortOption) => {
    const params = new URLSearchParams(currentSearchParams.toString());

    if (nextSort === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className={styles.sortControl}>
      <label htmlFor="holiday-sort" className={styles.label}>
        Sort by
      </label>

      <select
        id="holiday-sort"
        value={value}
        onChange={(event) =>
          handleChange(event.target.value as HolidayPackageSortOption)
        }
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
