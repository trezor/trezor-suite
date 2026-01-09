import '@playwright/test';
import { Model } from '@trezor/trezor-user-env-link/src/types';

import { PlaywrightTarget } from './playwright-base.config';

declare module '@playwright/test' {
    interface PlaywrightTestOptions {
        target: PlaywrightTarget;
        model: Model;
    }
}
