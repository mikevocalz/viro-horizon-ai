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

## Homework tutoring + generated XR

The Studio tabs are **Tutor · Scan · Classify · XR**:

1. **Scan** (`react-native-vision-camera`) captures a homework photo, which is downscaled +
   JPEG-compressed (`expo-image-manipulator`) and then **grayscale + contrast enhanced via an
   offscreen Skia pass** (`imagePrep.ts`) for sharper text, before **on-device OCR**
   (ExecuTorch CRAFT, `useOCR`) extracts the text locally and `parseHomeworkText` derives
   subject/topic/keywords/questions — no network. If OCR yields too little text it falls
   back to the Gemini vision parse route (`/api/homework/parse`). "Load sample" seeds a
   solar-system scan so the whole flow is demoable without camera/keys.
2. A deterministic planner (`buildXRScenePlan`) produces an `XRScenePlan` + a
   `RodinGenerationPlan`. For solar-system topics it sets `shouldOfferXR`.
3. **Tutor** (the converted chat — **Gemini primary**, on-device ExecuTorch secondary via
   the toggle; tutor system prompt) shows a **Study in XR** CTA card.
4. Tapping it routes to **XR**, which opens `SolarSystemGeneratedScene` *instantly* with
   procedural sphere placeholders, lights, spin, labels, and a floating tutor panel —
   while `runXRGeneration` drives a Rodin job (`/api/xr/rodin/*`).
5. Each generated GLB streams into the cross-runtime store and `GeneratedModelSlot` swaps
   the placeholder for `Viro3DObject` without resetting the scene; GLB load errors revert
   to the placeholder. No Horizon fallback — the scene renders on all targets.
6. **Homework images in XR:** the illustration region is localized either by Gemini
   (`diagramBox`) or **fully on-device** (`detectDiagram.ts`) — a Skia content grid
   (`contentGrid`, ink/color vs. blank paper) minus the OCR text boxes, taking the largest
   connected non-text picture blob (handles inline pictures; falls back to the largest
   text-free band). The scanner crops it (`cropDiagram`) and the scene shows it as a
   `ViroImage` "From your homework" panel. The crop is also sent to Rodin as **image-to-3D**
   input so the generated model matches the child's homework picture (text-to-3D otherwise).

**Rodin seam:** components/routes depend only on `RodinProvider` (`src/services/rodin/`).
`RealRodinProvider` calls Hyper3D Gen-2.5 (start → poll `status` → `download` GLB, one task
per asset); `MockRodinProvider` (time-based) runs until `RODIN_API_KEY` is set.
TODO markers flag where the real mesh-optimization stage and Gen-2.5 tier confirmation go.

## Known-risk matrix (non-stable / forced pins)

These are the dependencies that aren't plain stable releases. Each only fully
validates in a **native dev build** (`expo run:ios` / `expo run:android`) — not
Expo Go, not `tsc`.

| Pin | Why it's a risk | What validates it |
| --- | --- | --- |
| `react-native@0.86.0` | Forced via `overrides` (Expo SDK 56 recommends 0.85.3) | Native build of the whole app |
| `@reactvision/react-viro@2.56.0` | Peer caps at Expo <56 / RN <0.84; native modules built ≤0.83 | Viro AR/XR scene compiles + renders |
| `@react-native-runtimes/core` + `/state` `0.1.0-alpha` | Pre-release; Nitro native; secondary-runtime styling unproven | Chat/Classify lists render on threads |
| `react-native-nitro-modules@0.35.9` | Native layer shared by runtimes + Vision Camera | All Nitro modules co-compile |
| `react-native-vision-camera@5.0.11` | Nitro-based; needs config plugin + native build | Homework scanner captures photos |
| `@shopify/react-native-skia@2.6.3-next.1` | `@next` (Graphite backend) prerelease | Gradient headers render |
| `nativewind@5.0.0-preview.4` (+ `tailwindcss@4`, `react-native-css@3`) | Preview; rewrites `react-native` imports app-wide | `className` styling renders |
| `expo-horizon-core@55.0.1` | Versioned to SDK 55, used on SDK 56 | Quest build flavor + `isHorizonDevice()` |
| Rodin 3D generation (Hyper3D Gen-2.5) | `RealRodinProvider` implemented; `MockRodinProvider` used until `RODIN_API_KEY` is set | Real generation with creds + native GLB load |

> If the native build fails, suspect a collision between the Nitro consumers
> (runtimes + Vision Camera) or Viro vs RN 0.86 first.

## Styling (NativeWind v5 / Tailwind v4)

Main-thread screens are styled with NativeWind v5 (`className`); `src/global.css`
imports Tailwind v4 + `nativewind/theme` and defines the brand palette via
`@theme` (mirroring `src/constants/theme.ts`), so utilities like `bg-background`,
`text-muted`, `bg-accent`, `border-border` match the Skia gradients and nav chrome.

- `metro.config.js` composes `withNativewind(withThreadedRuntime(getDefaultConfig))`.
  NativeWind sets Metro's top-level `transformerPath` (delegating to Expo's worker)
  and enables `globalClassNamePolyfill`, so `className` works on stock
  `react-native` imports with no `babel.config.js`. We restore Expo's
  `babelTransformerPath` after the runtimes wrap.
- `postcss.config.mjs` uses `@tailwindcss/postcss`; types come from
  `nativewind-env.d.ts`.
- Kept on `StyleSheet`: the two secondary-runtime list components (NativeWind's
  CSS runtime isn't initialized in a secondary Hermes instance), the Skia gradient
  stops, navigation `screenOptions` colors, and Lucide icon `color` props.

> NativeWind v5 is `5.0.0-preview` (Tailwind v4 + `react-native-css@3`); validate
> styling in a native build (`expo run:*`).

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
