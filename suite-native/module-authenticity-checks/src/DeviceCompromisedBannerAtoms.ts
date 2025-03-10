import { atom } from 'jotai';

/**
 * Represents the display variants for the DeviceCompromisedBanner.
 * - 'none': Banner is hidden
 * - 'brief': Shows banner with only title
 * - 'extended': Shows banner with title, subtitle and CTA
 * - 'other-error': Shows only a warning banner that check could not be performed
 */
export type DeviceCompromisedBannerVariant = 'none' | 'brief' | 'extended' | 'other-error';

export const deviceCompromisedBannerAtom = atom<DeviceCompromisedBannerVariant>('none');
