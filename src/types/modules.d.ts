// `@ungap/structured-clone` ships no type declarations.
declare module '@ungap/structured-clone' {
  const structuredClone: <T>(value: T, options?: { lossy?: boolean; json?: boolean }) => T;
  export default structuredClone;
}

// CSS side-effect import (NativeWind global stylesheet). NativeWind's Metro type
// generation also declares this at build time; declared here so `tsc` is clean
// without a prior Metro run.
declare module '*.css';

