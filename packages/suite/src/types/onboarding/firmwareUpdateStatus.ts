import {
    STARTED,
    DOWNLOADING,
    INSTALLING,
    DONE,
} from '@suite/actions/onboarding/constants/firmwareUpdateStatus';

export type AnyStatus = typeof STARTED | typeof DOWNLOADING | typeof INSTALLING | typeof DONE;
