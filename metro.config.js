// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const { withThreadedRuntime } = require('@react-native-runtimes/core/metro');

const config = getDefaultConfig(__dirname);

// `withThreadedRuntime` scans `src` for <OnRuntime>/threaded components, generates
// the secondary-runtime entry, and adds its watch folder. It also swaps in a babel
// transformer that chains to the bare RN one — but that swap exists only for the
// `runtimeFunction` feature, which we don't use. We restore Expo's transformer so
// babel-preset-expo (reanimated/worklets, expo-router, etc.) keeps working.
const expoBabelTransformerPath = config.transformer.babelTransformerPath;
const threadedConfig = withThreadedRuntime(config);
threadedConfig.transformer.babelTransformerPath = expoBabelTransformerPath;

module.exports = threadedConfig;
