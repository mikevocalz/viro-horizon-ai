# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Standing preferences

- **Terse output.** Lead with the result. No preamble, no recaps of what you're
  about to do, no restating the prompt. Show diffs/commands, not narration.
- **Zustand only for state.** Do **not** use `useState` / `useReducer`. Put state
  in a Zustand store under `src/state/` (one store per feature domain). `useRef`
  for non-reactive refs and `useWindowDimensions`/layout hooks for derived view
  metrics are fine.
- **Brand gradients.** Use the gradients in `src/constants/theme.ts` (`brand`,
  `dusk`, `ember`) rendered via the Skia `GradientHeader`. Don't hardcode new
  gradient color stops in screens — add a named entry to `Gradients` instead.
- **Styling = NativeWind.** Main-thread screens use `className` (NativeWind v5 /
  Tailwind v4). Brand colors live in `@theme` in `src/global.css`, mirroring
  `theme.ts`. Keep on `StyleSheet`/constants: the secondary-runtime list
  components (`src/components/runtime/`), Skia gradient stops, navigation
  `screenOptions`, and Lucide icon `color` props.

## Verify before pinning

Never guess package versions. Check npm (`npm view <pkg> version`) and peer deps
before adding/upgrading. If a package can't resolve cleanly, stop and ask rather
than force-shipping something broken.

## Gates

- `npm run typecheck` (`tsc --noEmit`) must pass clean before finishing.
- Install with `npm install --legacy-peer-deps` (Viro's peer deps lag RN 0.86;
  resolution is forced via `overrides` in `package.json`).

## Architecture notes

- Routing: `expo-router`, files under `src/app` (`@/*` → `./src/*`). Drawer is the
  outer shell; `(tabs)` is the first drawer route (a 3-tab group).
- On-device AI: `react-native-executorch`. `initExecutorch()` is called once in
  `src/app/_layout.tsx`. Model configs live in `src/lib/executorch.ts`.
- Haptics: `react-native-pulsar` via `src/lib/haptics.ts` (semantic helpers).
- XR: `@reactvision/react-viro`; native-only (web split into `*.web.tsx`).
- Quest/Horizon: `expo-horizon-core`; runtime checks via `src/lib/horizon.ts`.
- Viro API guidance: use the ViroReact MCP server registered in `.mcp.json`.
- Threaded rendering: heavy lists run on secondary runtimes via
  `@react-native-runtimes/core` (`src/components/runtime/`). Data crosses the
  runtime boundary through `src/state/shared/` (native `createSharedStore`, web
  Zustand) — never a main-runtime store. Keep secondary-runtime components
  self-contained (RN primitives + theme + shared store only; no navigation/ctx).
