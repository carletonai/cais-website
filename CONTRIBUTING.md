## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: TailwindCSS
- **Package Manager**: pnpm
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 18 or later
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
for large text (>=24px, or >=18.66px bold).

Most text sits on a stack of gradients, blurred blooms and grid overlays rather
than on a flat colour, so contrast cannot be checked by reading Tailwind classes.
`pnpm test:contrast` measures it from rendered pixels instead — it screenshots
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

Two colour roles keep this working, and they are not interchangeable:

- `primary` is the brand red as **ink**. It is light enough to clear 7:1 on
  every surface. Use it for text and icons.
- `brand` is the brand red as a **fill** — solid buttons, tinted chips,
  decorative blooms. It is dark enough that `foreground` on top of it clears
  7:1. A saturated red cannot do both jobs at once on a near-black ground.

Putting text on `bg-primary`, or a bloom on `primary`, is what previously made
whole pages unreadable. When adding decorative layers, keep their alpha low:
they sit behind body copy, and lifting the backdrop luminance breaks the
guarantee every ink colour depends on.

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

- **Home (/)**: Landing page showcasing CAIS's mission and latest updates
- **About (/about)**: Information about CAIS, our history, mission, and values
- **Events (/events)**: Upcoming and past events, workshops, and activities
- **Team (/team)**: Meet our executive team and contributors
- **Projects (/projects)**: Showcase of current and past projects
- **Contact (/contact)**: Get in touch with CAIS
