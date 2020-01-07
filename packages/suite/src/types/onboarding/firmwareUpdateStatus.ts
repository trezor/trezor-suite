import {
    STARTED,
    DOWNLOADING,
    INSTALLING,
    DONE,
} from '@onboarding-actions/constants/firmwareUpdateStatus';

export type AnyStatus = typeof STARTED | typeof DOWNLOADING | typeof INSTALLING | typeof DONE;
