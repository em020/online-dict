# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eudic-Online-Dict is a plugin-based online dictionary engine for the Eudic desktop dictionary app. Each dictionary source (Bing, Cambridge, Longman, etc.) is a separate plugin that scrapes web pages, parses results, and renders them via React components into static HTML.

## Commands

```bash
yarn fixtures          # Download test HTML fixtures for offline development
yarn storybook         # Start Storybook UI dev server on port 6066
yarn dev               # Gulp + webpack dev build with source maps
yarn buildonly         # Production build only (no tests)
yarn build             # Run tests + production build (updates eudic_config.json enabled flags)
yarn test              # Run Jest tests; auto-enables/disables plugins via parsetest
yarn bod               # Build and deploy networktest
yarn analyze           # Webpack bundle analyzer
```

Running a single test: `npx jest test/dicts/bing/engine.spec.ts`

## Architecture

### Plugin System

Each plugin lives in `src/dicts/<name>/` and follows this structure:
- `index.ts` — Main plugin class extending `HtmlDictPlugin` (from `src/interface/IPlugin.ts`). Implements `getPageResult()`, `parsePageResult()`, and `htmlTemplate()`.
- `pagefetch.ts` — Network request logic (fetching HTML from dictionary websites).
- `View.tsx` — React functional component for rendering parsed results.
- `style.scss` — Plugin-specific styles (uses shared theme from `src/_sass_shared/_theme.scss`).
- `eudic_config.json` — Plugin metadata (name, module, version, libid, enabled).
- `click.js` (optional) — Client-side JS bundled via Gulp with `src/dicts/base/basedict.js` into `dict.js`.

The `HtmlDictPlugin.fetch()` flow: fetch raw HTML → parse into structured data → render via `ReactDOMServer.renderToStaticMarkup()` → post-process links (`audio:` for pronunciation, `dic://` for cross-references).

### Shared Base Plugins

`src/dicts/base/` contains shared implementations for dictionary families (cambridge, jukuu, macmillan). Plugins like `cambridge_en2en` and `cambridge_en2zh` inherit from the base Cambridge plugin.

### Rendering Pipeline

`src/dicts/render.tsx` handles the React-to-HTML conversion. Each plugin's View component receives parsed data via `ViewPorps<T>` and renders to static markup. Links are rewritten to use Eudic's internal protocols.

### React Hydration (Optional)

Plugins can opt into client-side React interactivity by overriding `hydrateOptions()` in their plugin class (from `HtmlDictPlugin`, returns `HydrateOptions | null`). When enabled:

- `render.tsx` wraps the SSR output in `<div id="eudic-hydrate-root-${uuid}">`, embeds serialized data as `<script id="eudic-hydrate-data-${uuid}" type="application/json">`, and adds a `<script defer src="file://client.js?id=${uuid}">` tag.
- A `client.tsx` file in the plugin folder serves as the client entry — it reads the UUID from its script URL, parses the embedded JSON data, and calls `ReactDOM.hydrate()` to attach event listeners to the existing DOM.
- Webpack auto-detects `client.tsx` files and produces a separate `client.js` bundle per plugin.
- Plugins without `client.tsx` are unaffected — they continue to use static-only rendering.

With hydration, View components can use `useState`, `useEffect`, and React event handlers. The existing `dict.js` (via `click.js` + `basedict.js`) continues to run for host-level side effects. Avoid letting both React and dict.js mutate the same DOM elements — any element React controls should be managed exclusively through React state.

### Helpers

`src/dicts/helpers.ts` provides DOM parsing utilities (`getText`, `getInnerHTML`, `getOuterHTML`, `getFullLink`), DOMPurify sanitization, and `DictSearchResult<T>` type that wraps parsed results with optional audio and catalog metadata.

### Build Pipeline

1. **Gulp** — Concatenates each plugin's `click.js` with `src/dicts/base/basedict.js` into `dict.js`, transpiled via Babel.
2. **Webpack** — Bundles all plugins from `src/dicts/*/index.ts` entries, extracts SCSS to CSS, copies `eudic_config.json` and `dict.js` per plugin into `dist/<plugin-name>/`.

Output in `dist/` — each plugin folder contains `index.js`, `index.css`, `eudic_config.json`, and optionally `dict.js`.

### Testing

Tests in `test/dicts/<name>/engine.spec.ts` fetch live pages and validate parsing. After Jest runs, `test/parsetest.ts` reads results and toggles the `enabled` field in each plugin's `eudic_config.json`.

## Coding Conventions

- Plugin class names: PascalCase first letter + lowercase rest + `Plugin` (e.g., `BingPlugin`, not `BINGPlugin`). The `module.name` in `eudic_config.json` must match.
- Multi-language variants use underscore suffix: `macmillan_uk`, `macmillan_us`, `cambridge_en2zh`.
- Plugins returning no result must call `handleNoResult()` which rejects with `'NO_RESULT'`.