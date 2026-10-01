import type { SendFeeLevel } from './SendFee';

/**
 * The platform-independent behaviour of a network's send flow. It belongs to the network package
 * under `networks/`, never imports React or Redux, and receives what it needs (Connect, backends)
 * through dependency injection, so each platform reuses it unchanged.
 *
 * This showcase covers fee levels only; compose, sign and post-push hooks extend the same object.
 *
 * @serviceContract
 */
export type SendStrategy = {
    /** Levels the fee selector offers, in display order; the first one is the default. */
    getFeeLevels: () => readonly SendFeeLevel[];
};
