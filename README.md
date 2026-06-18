# Viro Horizon AI

An Expo app combining **on-device AI** (ExecuTorch) with a **ViroReact XR** layer,
targeting phones and **Meta Quest / Horizon OS**.

## Navigation

- **Drawer** (outer shell): `Studio` · `Models` · `Profile` · `Settings`
- **Studio** is a 3-tab group:
  1. **Chat** — on-device LLM chat (`useLLM`, Qwen3 0.6B)
  2. **Classify** — on-device image classification (`useClassification`, EfficientNet V2-S)
  3. **XR** — ViroReact AR scene (with a Quest fallback)

Tab presses and key interactions fire haptics via **`react-native-pulsar`**.

## Stack (resolved & pinned)

| Package | Version |
| --- | --- |
| expo | 56.0.12 (SDK 56) |
| react-native | **0.86.0** (forced via `overrides`) |
| react | 19.2.3 |
| expo-router | 56.2.11 |
| react-native-executorch | 0.9.2 |
| react-native-executorch-expo-resource-fetcher | 0.9.1 |
| @shopify/react-native-skia | 2.6.3-next.1 (`@next`, Graphite) |
| @reactvision/react-viro | 2.56.0 |
| expo-horizon-core | 55.0.1 |
| react-native-pulsar | 1.6.1 |
| lucide-react-native | 1.21.0 (+ react-native-svg 15.15.4) |
| react-native-reanimated / react-native-worklets | 4.3.1 / 0.8.3 |

## Known caveat — Viro on RN 0.86

`@reactvision/react-viro@2.56.0` declares peer deps `expo >=54 <56` and
`react-native >=0.81 <0.84`. To run it on the required Expo 56 / RN 0.86 stack we
force resolution with `overrides` in `package.json`:

```jsonc
"overrides": {
  "react": "19.2.3",
  "react-native": "0.86.0",
  "@reactvision/react-viro": { "react": "19.2.3", "react-native": "0.86.0", "expo": "56.0.12" }
}
```

This satisfies JS resolution and `tsc`. Viro ships **native modules** built against
RN ≤0.83, so the AR/XR native build (`expo run:*` / EAS) is the place to confirm the
native side compiles against 0.86. Install with `npm install --legacy-peer-deps`.

## On-device AI

`initExecutorch({ resourceFetcher: ExpoResourceFetcher })` is called once at the root
(`src/app/_layout.tsx`). Models download lazily on first use; manage local storage from
the **Models** screen.

## Hybrid chat (on-device + online fallback)

The Chat tab runs **on-device** (ExecuTorch / Qwen3 0.6B) by default and **falls back to
online** (Google Gemini) when the device runtime is unavailable or the model fails to
load. You can also switch engines manually via the segmented control. Both stream
token-by-token.

Online mode uses the **Vercel AI SDK** (`ai` + `@ai-sdk/react`) talking to an Expo Router
API route at `src/app/api/chat+api.ts`, which calls `streamText()` against
`@ai-sdk/google` (default model `gemini-3-pro-preview`, override with
`GOOGLE_CHAT_MODEL`). This requires:

- `web.output: "server"` in `app.json` (API routes need a server runtime).
- `GOOGLE_GENERATIVE_AI_API_KEY` in the server env (see `.env.example`).
- A host for the API route in production — set `EXPO_PUBLIC_API_BASE_URL` to its origin.
  In development the app derives the URL from the Expo dev server.

Streaming on native needs `expo/fetch` plus polyfills (`@ungap/structured-clone`,
`@stardazed/streams-text-encoding`), loaded once in `src/lib/polyfills.ts`.

## Threaded rendering (react-native-runtimes)

The heavy list rendering for **Chat** and **Classify** runs on secondary JS
runtimes (`@react-native-runtimes/core`), so streaming token updates and result
bars never block the main thread (navigation, composer, pickers).

- `src/components/runtime/*Surface.tsx` wrap a list in `<OnRuntime name=…>`;
  the matching `*.web.tsx` renders inline (web has one runtime, no Nitro).
- A secondary runtime is an isolated Hermes instance, so data crosses via the
  cross-runtime stores in `src/state/shared/` (`@react-native-runtimes/state`'s
  `createSharedStore` on native; a plain Zustand store on web). The screens
  (main runtime) write; the surfaces (secondary runtime) read.
- `metro.config.js` wraps the config with `withThreadedRuntime` (Expo's babel
  transformer is preserved). The Expo config plugin registers
  `@react-native-runtimes/state` in the secondary runtime.

> `@react-native-runtimes/*` are `0.1.0-alpha` and require a native (Nitro) build
> — validate threaded behavior with `expo run:*`, not Expo Go.

## Horizon OS

`expo-horizon-core`'s config plugin adds the `quest` product flavor; runtime detection
uses `isHorizonDevice()` (see `src/lib/horizon.ts`), surfaced on the Profile screen.

## ViroReact MCP server

`.mcp.json` registers the ViroReact MCP server (`https://mcp.reactvision.xyz/viro`).
Claude Code will prompt to approve it; use it for Viro API guidance.

## Develop

```bash
npm install --legacy-peer-deps
npm run typecheck   # tsc --noEmit
npm run ios         # or: npm run android  (native build required for Viro + ExecuTorch)
```

> Viro and ExecuTorch are native modules — use a development build (`expo run:ios` /
> `expo run:android`), not Expo Go.
