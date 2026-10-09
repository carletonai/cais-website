## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: TailwindCSS
- **Package Manager**: pnpm
- **Deployment**: Vercel (every push to `master` deploys)
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 20.19 or later
- pnpm (recommended for better performance and disk space efficiency)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/carletonai/cais-website.git
cd cais-website
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Development Guidelines

- **Branch Naming Convention**:

  - Features: `feature/name`
  - Bugfixes: `bugfix/name`
  - Upgrade: `upgrade/name`

- **Branching Strategy**:

  - Main branch: Protected, requires pull request reviews
  - Feature branches: Created for specific features or sections
    - `feature/setup-initial-routes`: Initial page structure and routing
    - `feature/hero-section`: Hero section development
  - Create new feature branches for major components or sections
  - Keep changes focused and atomic

- **Code Quality**:
  - ESLint for code linting
  - Prettier for code formatting
  - Jest for testing

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm serve        # Start production server
pnpm test         # Run tests
pnpm test:contrast # Audit colour contrast against WCAG AAA (needs a dev server)
pnpm lint         # Run linting
pnpm format       # Check formatting
```

## Accessibility

The site targets **WCAG 2.2 Level AAA** for contrast: 7:1 for body text, 4.5:1
for large text (>=24px, or >=18.66px bold). The one exception is the brand-red
text colour (`primary`), which is held to **AA** (4.5:1, 3:1 large): no red that
still looks red can reach 7:1 on the site's near-black background.

Text sits on dot grids, poster images and two surfaces (ink and cream "paper"),
so contrast cannot be checked by reading Tailwind classes. `pnpm test:contrast`
measures it from rendered pixels instead — it screenshots
each page twice (once normally, once with glyphs made transparent), diffs the
two to find the pixels each glyph covers, and evaluates the specified text
colour against the real backdrop at those pixels.

```bash
pnpm dev &                       # the audit drives a running dev server
pnpm test:contrast --base http://localhost:5173 --width 1280
pnpm test:contrast --base http://localhost:5173 --width 375   # mobile layout
```

It needs Playwright's chromium (`npx playwright install chromium`); set
`PLAYWRIGHT_CHROMIUM_PATH` to reuse a browser you already have. The script exits
non-zero when anything fails, so it can gate CI.

On a cream `data-surface="paper"` section the same token names are re-scoped
(src/app/globals.css), and `primary` is dark enough there to clear 7:1. Keep
text off the red rings: the audit hides SVG artwork, so it cannot see them.

Two colour roles keep this working, and they are not interchangeable:

- `primary` is the brand red as **ink**: the buttons' hue, lifted just enough to
  clear 4.5:1 on every surface. Use it for text and icons.
- `brand` is the brand red as a **fill** — solid buttons. It is dark enough that
  white on top of it clears 7:1. A saturated red cannot do both jobs at once on
  a near-black ground.
- `mark` is the posters' red for rings and bullets: graphics only, never text.

Putting text on `bg-primary` or `mark` is what makes pages unreadable.

## Adding an event

Events live in `src/data/events.json`; the newest go at the end.

- `time`: write `"6:00 PM - 7:00 PM"` (or a start time alone, `"6:00 PM"`). The
  site turns that into exact Ottawa times for countdowns, "happening now", and
  calendar files. Anything else (`""`, `"TBA"`) is shown as written and treated
  as an all-day event.
- `endDate`: only for events that run over several days (a competition, a
  weekend hackathon): the last day, `YYYY-MM-DD`. The event then shows as a date
  range and spans those days in calendars.
- `id`: never reuse or change one. Each event's page lives at
  `/events/<id>-<title>` (e.g. `/events/66-intro-to-agentic-ai`), and that link
  ends up in chats and calendars; the id is what keeps it working if the title
  changes.
- `poster`: put the image in `public/assets/events/` (about 1236px wide, JPEG).
  Images must be on this site: the production CSP blocks any other origin.
- `rsvpLink`, `materials`, `recording`, `page`: https links. They show up on the
  event's card and page with labels like "Code on GitHub" or "Register on Luma".

The build writes a page, a link preview (using the poster) and an `.ics` file
for every event, plus `/events.ics`, the calendar people subscribe to.

## Contributing

1. Fork the repository
2. Create your feature branch following the naming convention
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Project Structure

```
src/
├── components/   # Reusable UI components
├── app/          # Main application code
│   └── App.tsx   # Root application component
├── assets/       # Static assets
└── styles/       # Global styles and Tailwind config
```

### Pages Description

- **Home (/)**: Landing page with CAIS's mission, an About section (`/#about`), and upcoming and past events
- **Events (/events)**: Upcoming and past events, filterable by type and tag, plus the events calendar
- **Projects (/projects)**: Showcase of current and past projects, including the CAIS Terminal (/resources)
- **Governance (/governance)**: How the club is run; the landing page of the Team tab
- **Current Team (/team)**: This year's executive team
- **Past Teams (/team/past)**: Previous executive teams, year by year
- **Contact (/contact)**: Get in touch with CAIS

### Brand assets

The official CAIS logo files live in `public/brand/` (and are served at `carletonai.com/brand/`): `cais-logo.svg` on black, `cais-logo-transparent.svg` for dark backgrounds, and `cais-logo.jpg`. The site's `logo.svg`, `favicon.svg`, `apple-touch-icon.png` and `og-image.png` are all derived from them.
