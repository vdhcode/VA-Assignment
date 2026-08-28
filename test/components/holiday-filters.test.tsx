import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HolidayFilters } from "../../src/app/components/search-results/holiday-filters/holiday-filters.component";

import type {
  HolidayPackageFilterOptions,
  HolidayPackageSearchState,
} from "../../src/domain/holidays";

const replaceMock = vi.fn();

const searchParams = new URLSearchParams(
  "location=orlando&departureDate=2026-10-04",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => "/results",
  useSearchParams: () => searchParams,
}));

const filterOptions: HolidayPackageFilterOptions = {
  price: {
    min: 799,
    max: 2560,
  },
  starRatings: [3, 4, 5],
  facilities: [
    {
      id: "pool",
      label: "Pool",
    },
    {
      id: "gym",
      label: "Gym",
    },
    {
      id: "kids-club",
      label: "Kids club",
    },
  ],
};

const createSearchState = (
  overrides: Partial<HolidayPackageSearchState["filters"]> = {},
): HolidayPackageSearchState => ({
  filters: {
    facilities: [],
    starRatings: [],
    ...overrides,
  },
  sort: "recommended",
});

describe("HolidayFilters", () => {
  beforeEach(() => {
    replaceMock.mockClear();

    searchParams.delete("minPrice");
    searchParams.delete("maxPrice");
    searchParams.delete("rating");
    searchParams.delete("facilities");
  });

  it("renders the filter groups and price controls", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Filters" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("group", { name: "Price per person" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("group", { name: "Star rating" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("group", { name: "Facilities" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("slider", {
        name: "Minimum price per person",
      }),
    ).toHaveValue("799");

    expect(
      screen.getByRole("slider", {
        name: "Maximum price per person",
      }),
    ).toHaveValue("2560");
  });

  it("renders accessible labels for both price inputs", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState()}
      />,
    );

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();

    const numberInputs = screen.getAllByRole("spinbutton");

    expect(numberInputs).toHaveLength(2);
    expect(numberInputs[0]).toHaveValue(799);
    expect(numberInputs[1]).toHaveValue(2560);
  });

  it("keeps multiple ratings selected independently", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState({
          starRatings: [3],
        })}
      />,
    );

    const rating3 = screen.getByRole("checkbox", {
      name: /3 stars/i,
    });

    const rating4 = screen.getByRole("checkbox", {
      name: /4 stars/i,
    });

    expect(rating3).toBeChecked();
    expect(rating4).not.toBeChecked();

    fireEvent.click(rating4);

    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("rating=3%2C4"),
      { scroll: false },
    );
  });

  it("removes a rating while preserving other selected ratings", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState({
          starRatings: [3, 4],
        })}
      />,
    );

    const rating3 = screen.getByRole("checkbox", {
      name: /3 stars/i,
    });

    expect(rating3).toBeChecked();

    fireEvent.click(rating3);

    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("rating=4"),
      { scroll: false },
    );
  });

  it("supports selecting multiple facilities", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState({
          facilities: ["pool"],
        })}
      />,
    );

    const pool = screen.getByRole("checkbox", {
      name: "Pool",
    });

    const gym = screen.getByRole("checkbox", {
      name: "Gym",
    });

    expect(pool).toBeChecked();
    expect(gym).not.toBeChecked();

    fireEvent.click(gym);

    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("facilities=gym%2Cpool"),
      { scroll: false },
    );
  });

  it("preserves unrelated query parameters when changing a rating", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState()}
      />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /4 stars/i,
      }),
    );

    expect(replaceMock).toHaveBeenCalledWith(
      "/results?location=orlando&departureDate=2026-10-04&rating=4",
      { scroll: false },
    );
  });

  it("does not update the URL while a price slider is changing", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState()}
      />,
    );

    const minimumSlider = screen.getByRole("slider", {
      name: "Minimum price per person",
    });

    fireEvent.change(minimumSlider, {
      target: {
        value: "1000",
      },
    });

    expect(minimumSlider).toHaveValue("1000");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("updates the URL when the minimum price slider is released", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState()}
      />,
    );

    const minimumSlider = screen.getByRole("slider", {
      name: "Minimum price per person",
    });

    fireEvent.change(minimumSlider, {
      target: {
        value: "1000",
      },
    });

    fireEvent.pointerUp(minimumSlider);

    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("minPrice=1000"),
      { scroll: false },
    );
  });

  it("commits a changed minimum price input on blur", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState()}
      />,
    );

    const inputs = screen.getAllByRole("spinbutton");

    fireEvent.change(inputs[0], {
      target: {
        value: "1000",
      },
    });

    expect(replaceMock).not.toHaveBeenCalled();

    fireEvent.blur(inputs[0]);

    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("minPrice=1000"),
      { scroll: false },
    );
  });

  it("commits a changed maximum price input when the input loses focus", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState()}
      />,
    );

    const inputs = screen.getAllByRole("spinbutton");

    fireEvent.change(inputs[1], {
      target: {
        value: "2000",
      },
    });

    /*
     * Editing the input should only update local state.
     * The URL must not change while the user is still editing.
     */
    expect(replaceMock).not.toHaveBeenCalled();

    /*
     * Price changes are committed when the input loses focus.
     */
    fireEvent.blur(inputs[1]);

    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("maxPrice=2000"),
      { scroll: false },
    );
  });

  it("shows the clear button when filters are active", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState({
          starRatings: [4],
        })}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Clear all filters",
      }),
    ).toBeInTheDocument();
  });

  it("clears all filter parameters", () => {
    render(
      <HolidayFilters
        filterOptions={filterOptions}
        searchState={createSearchState({
          minPrice: 1000,
          maxPrice: 2000,
          starRatings: [4],
          facilities: ["pool"],
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Clear all filters",
      }),
    );

    expect(replaceMock).toHaveBeenCalledWith(
      "/results?location=orlando&departureDate=2026-10-04",
      { scroll: false },
    );
  });
});
