# Repository Guidelines

## Project Structure & Module Organization
`src/dicts/` contains each dictionary plugin. A typical plugin includes `index.ts`, `View.tsx`, `pagefetch.ts`, `style.scss`, and `eudic_config.json`. Shared runtime bridges live under `src/dicts/base/`, and shared helpers/interfaces live in `src/dicts/helpers.ts` and `src/interface/`. Tests are under `test/dicts/<dict>/` with saved fixture responses beside each spec. Build output is written to `dist/`.

## Documentation Sources
`README.md` is currently outdated and should not be treated as the source of truth for project architecture or key implementation details. Refer to `CLAUDE.md` when you need the current architecture overview or implementation notes for core parts of the system.

## Build, Test, and Development Commands
- `yarn dev`: runs `gulp` plus webpack in development mode.
- `yarn buildonly`: regenerates `dict.js` via `gulp` and builds `dist/` in production mode.
- `yarn build`: runs tests, then `buildonly`.
- `yarn test`: runs Jest and the parse test summary.
- `yarn fixtures`: updates local fixture inputs used by tests.
- `yarn bod`: builds and deploys the `networktest` output into the local Eudic dictionary folder.

Use Node `16.19.1` and Yarn `1.22.22` for consistent output.

## Coding Style & Naming Conventions
Use TypeScript/React for plugin structure and small plain JS runtime bridges where required by Eudic. Follow the existing style: 2-space indentation in JS, 4-space indentation in TS files already using it, single quotes, and semicolons only where the file already uses them. Keep dictionary names folder-based and lowercase, for example `cambridge_en2en` or `networktest`.

Do not hand-edit generated `src/dicts/*/dict.js` unless you also update the source that feeds it, usually `click.js` plus `src/dicts/base/basedict.js`.

## Testing Guidelines
Jest is the test runner. Name specs `*.spec.ts` and keep them under `test/dicts/<dict>/`. Prefer fixture-backed tests that validate parsing against saved HTML in `test/dicts/<dict>/response/`. Run `yarn test` before opening a PR; run `yarn build` when changing build or runtime wiring.

## Commit & Pull Request Guidelines
Recent commits use short imperative subjects, for example `Refine desktop-only lookup controls` and `Improve Eudic embedded runtime debugging`. Keep subjects specific and under roughly 70 characters. PRs should include:
- a short problem/solution summary
- affected dictionary modules or shared bridge files
- test/build commands run
- screenshots or screen recordings for Eudic UI/runtime changes

## Contributor Notes
This repo has a two-step build: `gulp` generates runtime `dict.js`, then webpack builds page assets. If you change runtime click behavior, rebuild before testing or deploying.
