import { Model } from '@trezor/trezor-user-env-link';

export enum PlaywrightTarget {
    Web = 'web',
    Desktop = 'desktop',
}

export type SuiteTestOptions = {
    target: PlaywrightTarget;
    model: Model | undefined;
    firmwareVersion: string | undefined;
};
