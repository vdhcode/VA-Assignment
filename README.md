# Virgin Atlantic Front-End Test

A production-minded implementation of the Virgin Atlantic holiday search results experience.

The solution focuses on making the search state predictable, URL-driven, accessible, responsive and easy to test, while keeping the UI components focused on presentation and user interaction.

## Overview

The implementation provides:

- Holiday search result rendering from the supplied fixture data
- Price filtering with a dual-ended range slider
- Minimum and maximum price inputs
- Multiple star-rating selection
- Multiple facility selection
- Combined filters
- URL-persisted filter and sort state
- Clear-all filters
- Result count such as `4 of 6 holidays shown`
- Sorting by recommended, price and rating
- Empty-result state
- Fixture image handling with a graceful fallback
- Responsive desktop, tablet and mobile layouts
- Keyboard-friendly controls and accessible labelling
- Automated domain and component tests

## Design approach

The implementation intentionally separates business logic from UI code.

```text
URL search parameters
        │
        ▼
Search-state parsing
        │
        ▼
Domain filtering + sorting
        │
        ▼
Search results page
        │
        ├── Filters
        ├── Sort
        └── Holiday cards
```

The domain layer does not depend on React or Next.js. This keeps filtering, sorting and URL parsing deterministic and easy to test.

## Architecture

### Domain layer

The domain layer owns:

- Holiday package types
- Search/filter state
- Supported sort options
- URL parsing
- URL serialization
- Filtering
- Sorting
- Filter-option derivation

The URL parser is framework-independent. It accepts `URLSearchParams` and produces a typed `HolidayPackageSearchState`.

This is useful because the same logic can be tested without rendering React components.

### Results page

The results page receives the Next.js search parameters, resolves the current search state and passes the derived data into the presentation layer.

The page follows this general flow:

```text
fixture data
    ↓
normalise fixture data
    ↓
derive available filter options
    ↓
parse URL search state
    ↓
filter holiday packages
    ↓
sort holiday packages
    ↓
render results
```

### Search results component

`SearchResultsComponent` is responsible for the results experience rather than the business rules.

It coordinates:

- Search summary
- Filter panel
- Result count
- Sort control
- Holiday cards
- Empty state

The result count is exposed using `aria-live="polite"` so changes can be announced to assistive technology without being overly disruptive.

### Holiday card

The holiday card is deliberately presentation-focused.

It renders:

- Destination
- Hotel name
- Rating
- Board basis
- Departure date
- Highlights
- Facilities
- Price per person
- Total price

Filtering, sorting and URL state remain outside the card.

The card also protects the layout from unusually long hotel names by visually limiting the title to two lines.

## Filtering behaviour

### Price

The price filter supports two ways of changing the selected range:

1. Dragging the minimum/maximum slider handles
2. Editing the `From` and `To` inputs

The important UX decision is that slider movement updates local UI state while the user is moving the handle. The search URL is committed when the interaction finishes rather than on every movement.

This avoids repeatedly triggering the complete filtering/navigation flow while dragging.

The selected range is visually highlighted using the Virgin Atlantic accent colour, while the inactive portions of the track remain neutral.

The text inputs and slider share the same selected range state, so editing one representation updates the other.

### Star rating

Ratings are true multi-select checkboxes.

For example:

```text
3 stars + 4 stars
        ↓
rating=3,4
```

Ratings are normalised before being written to the URL so the representation is deterministic.

### Facilities

Facilities are also multi-select.

For example:

```text
Pool + Gym
      ↓
facilities=gym,pool
```

Unknown and duplicate values are ignored/normalised by the domain layer.

### Clear filters

Clear-all removes the filter-specific parameters while preserving unrelated query parameters.

This keeps URL state predictable and avoids accidentally removing parameters that are not owned by the filter UI.

## URL as the source of truth

A key design decision is treating the URL as the persisted search state.

Examples:

```text
/results
/results?rating=3,4
/results?facilities=pool,gym
/results?minPrice=1000&maxPrice=2000
/results?rating=3,4&facilities=pool&sort=price
```

Benefits:

- Refreshing the page preserves the search
- URLs can be bookmarked/shared
- Browser navigation works naturally
- Search state is visible and debuggable
- UI state can be reconstructed from a URL

The serializer preserves unrelated query parameters and normalises multi-value filters into a stable order.

## Sorting

The sort control supports:

- Recommended
- Price: Low to high
- Rating: High to low

Changing the sort keeps the existing filter/search parameters intact.

Selecting Recommended removes the explicit sort parameter so the default behaviour is represented by the absence of a sort value.

## Image handling

The implementation always uses the image URL supplied by the fixture when one is present.

It does **not** silently invent or substitute another image URL.

The image component uses `next/image` and falls back to an accessible placeholder when:

- The fixture does not contain an image
- The supplied image fails to load

The fixture uses `example.test` image URLs that are not available to Next.js image optimisation in the local environment. Because of that, `unoptimized` is intentionally used for the fixture-backed images.

If real production image URLs are supplied in a production environment, the image configuration can be revisited and optimisation enabled where appropriate.

## Accessibility

Accessibility was treated as part of the component implementation, not as a final pass.

Examples:

- Semantic `fieldset`/`legend` groups for filter categories
- Native checkbox inputs for multi-select filters
- Native range inputs for the price slider
- Labels for range controls
- Proper `<label>` + `<select>` for sorting
- Visible keyboard focus states
- Keyboard interaction for price controls
- `aria-live="polite"` for changing result counts
- Semantic `<article>` and heading structure for holiday cards
- Accessible rating text for rated and unrated hotels
- Meaningful image alternative text
- Accessible image fallback
- Empty-state messaging

The implementation avoids replacing native controls with custom clickable containers where a native accessible control is sufficient.

## Responsive design

The layout is designed to progressively adapt across viewport sizes.

Desktop:

```text
┌─────────────┐ ┌─────────────────────────────┐
│   Filters   │ │ Card │ Card │ Card          │
│             │ │      │      │               │
└─────────────┘ └─────────────────────────────┘
```

Tablet:

```text
┌─────────────┐ ┌───────────────────────┐
│   Filters   │ │ Card │ Card           │
└─────────────┘ └───────────────────────┘
```

Mobile:

```text
┌─────────────────────┐
│       Filters       │
└─────────────────────┘

┌─────────────────────┐
│        Card         │
└─────────────────────┘

┌─────────────────────┐
│        Card         │
└─────────────────────┘
```

The implementation was manually checked at desktop and mobile widths, including keyboard navigation.

## Fixture and data considerations

The supplied fixture contains multiple holiday packages, including cases such as:

- Different prices
- Different ratings
- Unrated hotels
- Different board bases
- Different facilities
- Missing/optional content
- Multiple packages for the same hotel
- Fixture image URLs

The implementation uses the fixture as the source of truth rather than hard-coding specific result counts into the UI.

## Handling edge cases

The domain logic explicitly accounts for invalid or inconsistent URL values.

Examples include:

- Unknown ratings
- Unknown facilities
- Duplicate ratings
- Duplicate facilities
- Empty filter values
- Invalid numeric price values
- Negative numeric values
- Invalid sort values

The parser normalises valid values and ignores values that are not supported by the currently available fixture/filter options.

## Testing strategy

The tests are intentionally split into two levels.

### Domain tests

Domain tests cover the framework-independent behaviour:

- Search-state parsing
- URL serialisation
- Price handling
- Rating combinations
- Facility combinations
- Filtering
- Sorting
- Invalid values
- Duplicate values
- Preservation of unrelated query parameters

### Component tests

Component tests cover observable UI behaviour:

- Filter rendering
- Multiple rating selection
- Multiple facilities
- Price slider interaction
- Price input interaction
- Clear filters
- Sort selection
- Holiday card content
- Rating display
- Facility limits
- Missing facilities
- Image fallback
- Long hotel names

Current test result:

```text
6 test files
73 tests
73 passed
```

## Verification

Before submission, the application was checked with:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The production build completed successfully.

## Running locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the local `/results` route shown by the Next.js development server.

Useful commands:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run start
```

## Example search URLs

These are useful for manually verifying URL-driven state:

```text
/results
/results?rating=3
/results?rating=3,4
/results?facilities=pool
/results?facilities=gym,pool
/results?minPrice=1000
/results?maxPrice=2000
/results?minPrice=1000&maxPrice=2000
/results?rating=3,4&facilities=pool&sort=price
```

The exact number of matching results depends on the supplied fixture data.

## Key implementation decisions

### Why keep filtering and sorting in the domain layer?

It makes the core behaviour deterministic and independently testable. The UI does not need to know how the filtering algorithm works.

### Why use the URL for search state?

It makes the results page shareable, reloadable and compatible with browser history.

### Why use local state for the price slider?

Dragging is a transient interaction. Committing the URL only when the user finishes the interaction avoids unnecessary navigation/search work while still keeping the URL authoritative after a commit.

### Why use native form controls?

Native checkboxes, range inputs and selects provide keyboard interaction and baseline accessibility without requiring a larger custom-control implementation.

### Why use a presentation-focused card?

A card should display a holiday package. It should not own search concerns, URL manipulation or filtering rules.

### Why keep image fallback logic separate?

Image loading can fail independently of the rest of the card. Keeping it isolated makes the behaviour easier to reason about and test.

## What I would discuss in an interview

The most important parts of this implementation are not the individual JSX elements. They are the engineering decisions:

1. **URL-driven state** — why search state belongs in the URL and how parsing/serialisation are kept deterministic.
2. **Domain/UI separation** — why filtering and sorting are framework-independent.
3. **Price slider interaction** — why the UI uses transient local state and delays URL commits until the interaction completes.
4. **Accessibility** — why native controls were preferred and how keyboard/screen-reader behaviour was considered.
5. **Fixture reliability** — why fixture data is treated as the source of truth and why image URLs are never silently replaced.
6. **Testing strategy** — why both domain-level and component-level tests are useful.
7. **Trade-offs** — where the implementation intentionally favours simplicity over introducing global state or unnecessary abstraction.

## Final result

The final implementation aims to balance:

```text
Correctness
    +
Usability
    +
Accessibility
    +
Maintainability
    +
Testability
    +
Responsive UI
```

rather than focusing only on making the page look correct.
