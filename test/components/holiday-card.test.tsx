import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HolidayCard } from "../../src/app/components/search-results/holiday-card/holiday-card.component";
import { HolidayImage } from "../../src/app/components/search-results/holiday-card/holiday-image.component";

import type { HolidayPackage } from "../../src/domain/holidays";

/*
 * Next/Image performs framework-specific image processing that is not
 * required for these component tests. Replacing it with a normal img
 * keeps the tests focused on our component behaviour.
 */
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onError,
  }: {
    src: string;
    alt: string;
    onError?: () => void;
  }) => (
    <button
      type="button"
      role="img"
      aria-label={alt}
      data-testid="holiday-image"
      data-src={src}
      onClick={onError}
    />
  ),
}));

const createHoliday = (
  overrides: Partial<HolidayPackage> = {},
): HolidayPackage =>
  ({
    id: "holiday-1",

    hotel: {
      id: "hotel-1",
      name: "Beach Club Resort",
      destination: "Orlando",
      propertyType: "Hotel",
      boardBasis: "Room Only",
      description: "A test holiday package",
      highlights: [
        "Near the beach",
        "Family friendly",
        "Swimming pool",
        "Airport transfers",
      ],
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
          id: "restaurant",
          label: "Restaurant",
        },
        {
          id: "parking",
          label: "Parking",
        },
        {
          id: "spa",
          label: "Spa",
        },
      ],
      starRating: {
        ratingType: "rated",
        value: 4,
      },
      image: {
        url: "https://example.com/beach-club.jpg",
        alt: "Beach Club Resort",
      },
    },

    pricing: {
      perPerson: 1705,
      total: 3410,
    },

    dates: {
      departure: "2026-10-04",
      selected: "2026-10-04",
    },

    rewards: {
      flyingClubMiles: 0,
      virginPoints: 0,
      tierPoints: 0,
    },

    ...overrides,
  }) as HolidayPackage;

describe("HolidayCard", () => {
  it("renders the hotel name and destination", () => {
    render(<HolidayCard holiday={createHoliday()} />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Beach Club Resort",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Orlando")).toBeInTheDocument();
  });

  it("renders board basis and departure date", () => {
    render(<HolidayCard holiday={createHoliday()} />);

    expect(screen.getByText("Board basis")).toBeInTheDocument();
    expect(screen.getByText("Room Only")).toBeInTheDocument();

    expect(screen.getByText("Departs")).toBeInTheDocument();
    expect(screen.getByText("2026-10-04")).toBeInTheDocument();
  });

  it("renders the hotel rating", () => {
    render(<HolidayCard holiday={createHoliday()} />);

    expect(screen.getByLabelText("4 star rating")).toBeInTheDocument();

    expect(screen.getByText("★ 4")).toBeInTheDocument();
  });

  it("renders an accessible unavailable rating for unrated hotels", () => {
    const holiday = createHoliday({
      hotel: {
        ...createHoliday().hotel,
        starRating: {
          ratingType: "unrated",
        },
      },
    });

    render(<HolidayCard holiday={holiday} />);

    expect(
      screen.getByLabelText("Hotel rating unavailable"),
    ).toBeInTheDocument();

    expect(screen.getByText("★ –")).toBeInTheDocument();
  });

  it("renders the price per person and total price in GBP", () => {
    render(<HolidayCard holiday={createHoliday()} />);

    expect(
      screen.getByText("£1,705", {
        exact: false,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("£3,410 total")).toBeInTheDocument();

    expect(screen.getByText("per person")).toBeInTheDocument();
  });

  it("renders up to three highlights", () => {
    render(<HolidayCard holiday={createHoliday()} />);

    expect(screen.getByText("Near the beach")).toBeInTheDocument();
    expect(screen.getByText("Family friendly")).toBeInTheDocument();
    expect(screen.getByText("Swimming pool")).toBeInTheDocument();

    expect(screen.queryByText("Airport transfers")).not.toBeInTheDocument();
  });

  it("renders up to four facilities and shows the remaining count", () => {
    render(<HolidayCard holiday={createHoliday()} />);

    expect(screen.getByText("Pool")).toBeInTheDocument();
    expect(screen.getByText("Gym")).toBeInTheDocument();
    expect(screen.getByText("Restaurant")).toBeInTheDocument();
    expect(screen.getByText("Parking")).toBeInTheDocument();

    expect(screen.queryByText("Spa")).not.toBeInTheDocument();

    expect(screen.getByText("+1 more")).toBeInTheDocument();

    expect(screen.getByLabelText("1 more facilities")).toBeInTheDocument();
  });

  it("shows a fallback message when the hotel has no facilities", () => {
    const holiday = createHoliday({
      hotel: {
        ...createHoliday().hotel,
        facilities: [],
      },
    });

    render(<HolidayCard holiday={holiday} />);

    expect(
      screen.getByText("Facility information not available"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("list", {
        name: "Facilities",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the image supplied by the fixture", () => {
    render(<HolidayCard holiday={createHoliday()} />);

    const image = screen.getByRole("img", {
      name: "Beach Club Resort",
    });

    expect(image).toHaveAttribute(
      "data-src",
      "https://example.com/beach-club.jpg",
    );
  });

  it("passes a missing image through to the image fallback", () => {
    const holiday = createHoliday({
      hotel: {
        ...createHoliday().hotel,
        image: null,
      },
    });

    render(<HolidayCard holiday={holiday} />);

    expect(
      screen.getByRole("img", {
        name: "Beach Club Resort image unavailable",
      }),
    ).toBeInTheDocument();
  });

  it("does not expose more than four facility chips", () => {
    const holiday = createHoliday({
      hotel: {
        ...createHoliday().hotel,
        facilities: Array.from({ length: 10 }, (_, index) => ({
          id: `facility-${index}`,
          label: `Facility ${index}`,
        })),
      },
    });

    render(<HolidayCard holiday={holiday} />);

    expect(screen.getByText("Facility 0")).toBeInTheDocument();
    expect(screen.getByText("Facility 1")).toBeInTheDocument();
    expect(screen.getByText("Facility 2")).toBeInTheDocument();
    expect(screen.getByText("Facility 3")).toBeInTheDocument();

    expect(screen.queryByText("Facility 4")).not.toBeInTheDocument();

    expect(screen.getByText("+6 more")).toBeInTheDocument();
  });

  it("renders a long hotel name without removing the complete value from the DOM", () => {
    const longName =
      "Garden Suites with an Exceptionally Long Descriptive Hotel Name";

    const holiday = createHoliday({
      hotel: {
        ...createHoliday().hotel,
        name: longName,
      },
    });

    render(<HolidayCard holiday={holiday} />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: longName,
      }),
    ).toBeInTheDocument();
  });
});

describe("HolidayImage", () => {
  it("renders the supplied image URL", () => {
    render(
      <HolidayImage src="https://example.com/hotel.jpg" alt="Hotel image" />,
    );

    const image = screen.getByRole("img", {
      name: "Hotel image",
    });

    expect(image).toHaveAttribute("data-src", "https://example.com/hotel.jpg");
  });

  it("shows the fallback when no image URL is supplied", () => {
    render(<HolidayImage src={undefined} alt="Hotel image" />);

    expect(
      screen.getByRole("img", {
        name: "Hotel image image unavailable",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("img", {
        name: "Hotel image",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows the fallback when the image fails to load", () => {
    render(
      <HolidayImage
        src="https://example.com/broken.jpg"
        alt="Broken hotel image"
      />,
    );

    const image = screen.getByRole("img", {
      name: "Broken hotel image",
    });

    fireEvent.click(image);

    expect(
      screen.getByRole("img", {
        name: "Broken hotel image image unavailable",
      }),
    ).toBeInTheDocument();
  });
});
