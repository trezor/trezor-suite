import { Model } from '@trezor/trezor-user-env-link';

export enum PlaywrightTarget {
    Web = 'web',
    Desktop = 'desktop',
}

export type SuiteTestOptions = {
    target: PlaywrightTarget;
    model: Model | undefined;
    firmwareVersion: string | undefined;
    // Profiles the test flow via the dedicated Sentry e2e config. Defaults to true for web tests
    // (set in suiteBaseFixture) and is ignored for desktop. Set false per test to opt out.
    sentryProfiling: boolean;
};
