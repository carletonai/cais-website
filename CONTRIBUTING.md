## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: TailwindCSS
- **Package Manager**: pnpm
- **Deployment**: Vercel (every push to `master` deploys)
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 22.12 or later (or 20.19 or later in the 20 line)
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
pnpm dev           # Start development server
pnpm build         # Build for production and prerender every page
pnpm serve         # Serve the production build
pnpm test          # Run tests
pnpm test:contrast # Audit colour contrast against WCAG AAA (needs a dev server)
pnpm check         # Typecheck, lint and check formatting, as CI does
pnpm fix           # Fix lint and formatting
```

## Accessibility

The site targets **WCAG 2.2 Level AAA** for contrast: 7:1 for body text, 4.5:1
for large text (>=24px, or >=18.66px bold). The one exception is the brand-red
text colour (`primary`), which is held to **AA** (4.5:1, 3:1 large): no red that
still looks red can reach 7:1 on the site's near-black background.

Text sits on poster images and two surfaces (ink and cream "paper"),
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
- `poster`: put the image in `public/assets/events/` (about 1236px wide, JPEG),
  and record its pixel size as `posterWidth` and `posterHeight` so the page
  can hold its space while it loads; the build fails if they are missing or
  wrong. Save a 600px-wide copy beside it as `<name>-600.jpg` for the event
  cards (the tests check it is there), for example with
  `convert poster.jpg -resize 600x -quality 82 -strip poster-600.jpg`.
  Images must be on this site: the production CSP blocks any other origin.
- `photos`: pictures from the event itself, shown in a grid under its page.
  Each is `{ "src", "width", "height", "alt" }`: a JPEG in a folder of its own
  under `public/assets/events/`, with a 600px copy beside it as for posters,
  and `alt` saying what the photo shows. The build fails if a size is wrong or
  `alt` is empty.
- `instagram`: the post the event was announced in, linked from its page. The
  Instagram sync fills it in, and skips any post an event already links.
- `rsvpLink`, `materials`, `recording`, `page`: https links. They show up on the
  event's card and page with labels like "Code on GitHub" or "Register on Luma".

The build writes a page, a link preview (using the poster) and an `.ics` file
for every event, plus `/events.ics`, the calendar people subscribe to.

## Adding an event from GitHub

The same thing without touching a file: open a **New event** issue
(Issues, New issue, the "New event" form). The issue's title, after
"Event:", is the event's title; fill in the date, a description and
whatever else you know, and drag the poster into the Poster box. On
submit, `.github/workflows/event-intake.yml` runs
`scripts/event-from-issue.mjs`, which turns the form into an entry at the
end of `events.json` (the next free id; the poster converted to JPEG,
scaled down if it is wider than 1600px, and its 600px copy made), checks
it the way CI would, and opens a pull request titled "Event: …". A person
merges the pull request: that puts the event on the site and closes the
issue.

- If a field cannot be read (a date like "next month", a link that is not
  https, a tag the site does not use), the issue gets a comment listing
  what to change. Edit the issue (the ··· menu on its first comment) and
  the check runs again; the same happens if you edit it after the pull
  request exists, which redrafts the pull request from scratch. If the
  run fails for another reason, the comment links to its log.
- Pasting the Instagram caption as the description is fine: the time, place
  and RSVP link are read from it when their own fields are blank, and its
  date, time, place and link lines, hashtags and emoji are kept off the
  card. Dates may be written out ("October 9"), but not as "Friday" or
  "next week", which would mean something else on a later edit.
- Only people in the carletonai organization or with access to the
  repository start a draft; anyone else gets a thank-you comment and an
  exec adds the event by hand. If your own submission gets no response,
  your organization membership may be private: ask an admin to make it
  public or to add you as a collaborator.
- Two event issues open at the same time draft the same id. Merge one,
  then edit the other issue so it takes the next free id.
- The workflow needs "Allow GitHub Actions to create and approve pull
  requests" turned on under Settings, Actions, General (the same setting
  the Instagram sync uses), and the `event` label to exist in the
  repository, which it does.

The Instagram sync below does the same for posts on its own, when it has a
token; the form needs none.

## The workshop curriculum

`/workshops` lays the club's workshop series out in the order to take them,
with each session's slides, code and recording. It is built from
`src/data/curriculum.json`, which only points at events: the titles, dates,
rooms and links all come from `events.json`, so a workshop is added there
first (above) and then placed in the curriculum.

- `series`: newest first; the first one is "this term" on the page. Each has
  an `id`, `title`, `season` ("Fall 2026", "2021–22"), a one-paragraph `lede`
  and its `modules` in the order they ran.
- A module is `{ "event": "<id>" }`, optionally with a `blurb` to use instead
  of the event's description (when the description reads as an announcement).
  A session still to be announced is `{ "title": "...", "blurb": "..." }` with
  no event; it shows as "Date to be announced" and goes after the dated ones.
  When the event is created, replace `title` with its `event` id.
- `standalone.events`: workshops run outside any series, by id.

The tests check that every id exists, is a workshop, and appears once.

## Mailing list

The email field in the home page's "Get involved" section subscribes people
to a [Buttondown](https://buttondown.com) newsletter. It is a plain form
posting to Buttondown, which sends the confirmation email and hosts the
archive and unsubscribe links, so the site keeps no addresses and needs no
key. Setting it up:

1. Create a Buttondown account for the club (the free plan covers the first
   100 subscribers; "Email updates" copy promises a few emails a year).
2. Set `NEWSLETTER_USERNAME` in `src/lib/links.ts` to the account's username.
   The field is not shown while it is `null`.
3. The production CSP already allows the post (`form-action` in
   `vercel.json`). Subscribers arriving from the site carry the tag
   `website`.

## Discord presence

The same section shows "42 online now · 1,200 members on Discord", read from
Discord's public invite API (`DISCORD_PRESENCE_URL` in `src/lib/links.ts`),
which describes a server to anyone holding an invite link and needs no key.
The invite must stay valid: if it is ever revoked and replaced, update
`DISCORD_INVITE` there. The answer is kept for five minutes in the browser,
and if Discord does not answer the line is simply left out.

## Instagram sync

Event announcements the club posts on Instagram can become draft events on
their own. `.github/workflows/instagram-sync.yml` runs
`scripts/instagram-sync.mjs` every morning: it reads the club's recent posts
and the posts the club is tagged in (which is how collaborations arrive),
works out which captions announce an event still to come, downloads their
posters, appends draft entries to `src/data/events.json` and opens a pull
request titled "Events announced on Instagram". Nothing reaches the site
until someone checks the drafts against the posts and merges that pull
request; the parser reads captions, it does not understand them. Each draft
keeps the post's link in its `instagram` field, and
`src/data/instagram-seen.json` remembers which posts were already decided.

Setting it up, once:

1. The club's Instagram account must be a professional account (Business or
   Creator; free, in Instagram's settings).
2. At <https://developers.facebook.com>, create an app, add the "Instagram"
   product with **Instagram API with Instagram Login**, add the club account
   as an Instagram tester, and generate a user access token with the
   `instagram_business_basic` permission. The app can stay in development
   mode: it only reads the club's own account, which needs no App Review.
3. Add that token to the repository as the Actions secret `IG_ACCESS_TOKEN`
   (Settings → Secrets and variables → Actions).
4. In Settings → Actions → General, allow GitHub Actions to create pull
   requests ("Allow GitHub Actions to create and approve pull requests").
5. Optional: `ANTHROPIC_API_KEY` lets a small Claude model double-check each
   caption the heuristics flag, which catches dates written in prose and
   posts that only sound like events. A handful of posts a week costs well
   under a dollar a month.
6. Optional: `ACTIONS_SECRET_PAT`, a fine-grained personal access token with
   "Secrets: read and write" on this repository, lets the job refresh the
   Instagram token every run so it never expires. Without it, the token
   lasts 60 days and has to be regenerated by hand (step 2) when it expires;
   the workflow then fails with a 400 from Instagram until it is.

What it costs: the Instagram API and GitHub Actions are free for this
repository; the only running cost is the optional Claude check. A collab post
authored by another account should arrive through the tagged-posts edge; if
one does not, ask the host to tag @carletonaisociety, or add the event by
hand as above.

Trying it without a token:

```sh
node scripts/instagram-sync.mjs --fixture posts.json --dry-run
```

where `posts.json` holds an Instagram API `media` response (or an array of
such items). `--dry-run` prints what would be added and writes nothing.

## Adding a partner

Organizations the club has worked with are listed on the home page from
`src/data/partners.json`: `name` (the full name, with its acronym in
brackets when it goes by one, e.g. "Carleton Computer Science Society
(CCSS)"), a one-line `blurb` saying what you did together, the `url` to
link to (or `null`), and a square `logo` under `public/assets/partners/`
(WebP, about 192px; or `null` to show the acronym or initials until there
is one).

## Contributing

1. Fork the repository
2. Create your feature branch following the naming convention
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Project Structure

```
src/
├── app/          # One folder per page, App.tsx (the routes) and globals.css
├── components/   # Reusable UI components
├── data/         # Everything the site shows: events, teams, projects, metadata
├── lib/          # Event times, calendar files, search and other helpers
└── main.tsx      # Entry point
scripts/          # Build-time prerendering, the contrast audit, the Instagram sync and the event intake
public/           # Static files: posters, brand assets, the constitution, 404.html
```

### Pages Description

- **Home (/)**: Landing page with CAIS's mission, an About section (`/#about`), and upcoming and past events
- **Events (/events)**: Upcoming and past events, filterable by type and tag, plus the events calendar
- **Event pages (/events/<id>-<title>)**: One page per event, with its poster as the link preview and calendar files
- **Workshop curriculum (/workshops)**: Every workshop series in the order to take it, with slides, code and recordings
- **Projects (/projects)**: Showcase of current and past projects
- **CAIS Terminal (/resources)**: An interactive terminal with the club's links, events, projects and learning resources
- **Governance (/governance)**: How the club is run; the landing page of the Team tab
- **Current Team (/team)**: This year's executive team
- **Past Teams (/team/past)**: Previous executive teams, year by year
- **Contact (/contact)**: Get in touch with CAIS

### Brand assets

The official CAIS logo files live in `public/brand/` (and are served at `carletonai.com/brand/`): `cais-logo.svg` on black, `cais-logo-transparent.svg` for dark backgrounds, and `cais-logo.jpg`. The site's `logo.svg`, `favicon.svg`, `apple-touch-icon.png` and `og-image.png` are all derived from them.
