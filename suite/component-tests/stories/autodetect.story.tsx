import { DataAnalytics } from '@trezor/product-components';

import { RealStoreStory } from '../gallery/storyProviders';

/**
 * Suite detects the browser's colour scheme and language at start-up and writes them into the
 * store, from where `ConnectedThemeProvider` and `ConnectedIntlProvider` pick them up.
 *
 * `RealStoreStory` mounts `Autodetect` alongside those providers, so this story reacts to the
 * `colorScheme` and `locale` a test sets on the browser context — no props needed.
 */
export const AnalyticsConsent = () => (
    <RealStoreStory>
        <DataAnalytics onConfirm={() => {}} />
    </RealStoreStory>
);
