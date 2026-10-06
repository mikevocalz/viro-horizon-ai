// `@ungap/structured-clone` ships no type declarations.
declare module '@ungap/structured-clone' {
  const structuredClone: <T>(value: T, options?: { lossy?: boolean; json?: boolean }) => T;
  export default structuredClone;
}

// CSS side-effect import (NativeWind global stylesheet). NativeWind's Metro type
// generation also declares this at build time; declared here so `tsc` is clean
// without a prior Metro run.
declare module '*.css';

// `react-native-viseme-xr` is a local `file:` dependency that only exists on
// the dev machine. Declared so `tsc` stays green where the package cannot be
// installed (e.g. CI checking out the merge ref, which includes files that
// import it). Members are `any`-ish: types are interfaces, values are classes.
declare module 'react-native-viseme-xr' {
  export interface Clock {
    [key: string]: any;
  }
  export class MediaPlayerClock {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export interface Sonic3Message {
    type: 'phoneme_timestamps';
    phoneme_timestamps: Sonic3PhonemeTimestamps;
    [key: string]: any;
  }
  export interface Sonic3PhonemeTimestamps {
    [key: string]: any;
  }
  export class RealtimeLipsyncDirector {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export class Sonic3PhonemeCollector {
    constructor(...args: any[]);
    [key: string]: any;
  }
}

