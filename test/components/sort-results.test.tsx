import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SortResults } from "../../src/app/components/search-results/sort-results/sort-results.component";

const replaceMock = vi.fn();

const searchParams = new URLSearchParams(
  "location=orlando&rating=3,4&facilities=pool",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => "/results",
  useSearchParams: () => searchParams,
}));

describe("SortResults", () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it("renders the sort label and all supported options", () => {
    render(<SortResults value="recommended" />);

    expect(screen.getByLabelText("Sort by")).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "Recommended",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "Price: Low to high",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "Rating: High to low",
      }),
    ).toBeInTheDocument();
  });

  it("renders the current sort value", () => {
    render(<SortResults value="price" />);

    expect(screen.getByLabelText("Sort by")).toHaveValue("price");
  });

  it("updates the URL when price sorting is selected", () => {
    render(<SortResults value="recommended" />);

    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: {
        value: "price",
      },
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/results?location=orlando&rating=3%2C4&facilities=pool&sort=price",
      { scroll: false },
    );
  });

  it("updates the URL when rating sorting is selected", () => {
    render(<SortResults value="recommended" />);

    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: {
        value: "rating",
      },
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/results?location=orlando&rating=3%2C4&facilities=pool&sort=rating",
      { scroll: false },
    );
  });

  it("removes the sort parameter when recommended is selected", () => {
    searchParams.set("sort", "price");

    render(<SortResults value="price" />);

    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: {
        value: "recommended",
      },
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/results?location=orlando&rating=3%2C4&facilities=pool",
      { scroll: false },
    );
  });
});
