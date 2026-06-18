// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const { withThreadedRuntime } = require('@react-native-runtimes/core/metro');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// react-native-runtimes: scans `src` for <OnRuntime>/threaded components, generates
// the secondary-runtime entry, and adds its watch folder. It also swaps in a babel
// transformer chaining to the bare RN one — but that swap exists only for the
// `runtimeFunction` feature, which we don't use. Restore Expo's transformer so
// babel-preset-expo (reanimated/worklets, expo-router) keeps working.
const expoBabelTransformerPath = config.transformer.babelTransformerPath;
const threadedConfig = withThreadedRuntime(config);
threadedConfig.transformer.babelTransformerPath = expoBabelTransformerPath;

// NativeWind sets Metro's top-level `transformerPath` (its CSS transformer delegates
// to Expo's worker) and enables `globalClassNamePolyfill`, so it composes cleanly on
// top of the threaded config without disturbing the babel transformer above.
module.exports = withNativewind(threadedConfig);
