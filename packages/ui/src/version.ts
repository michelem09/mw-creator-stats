// Build-time app version. The extension's Vite config injects __APP_VERSION__ from
// packages/extension/package.json; other builds (web/dev, tests) fall back to the
// literal below. `typeof` guard avoids a ReferenceError where it isn't defined.
declare const __APP_VERSION__: string | undefined;

export const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__ ? __APP_VERSION__ : "0.1.4";
