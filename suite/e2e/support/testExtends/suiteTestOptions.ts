import { Model } from '@trezor/trezor-user-env-link';

export enum PlaywrightTarget {
    Web = 'web',
    Desktop = 'desktop',
    // The Tauri shell runs the desktop-mode frontend. On macOS the native WKWebView cannot be
    // driven by WebDriver (tauri-driver is Linux/Windows only), so this target drives the exact
    // same desktop frontend build in Chromium with a JS-injected `window.desktopApi` mirroring the
    // Tauri Rust backend. The real native window is covered by a separate boot smoke test.
    Tauri = 'tauri',
}

export type SuiteTestOptions = {
    target: PlaywrightTarget;
    model: Model | undefined;
    firmwareVersion: string | undefined;
};
