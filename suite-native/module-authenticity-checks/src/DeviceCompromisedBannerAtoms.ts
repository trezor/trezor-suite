import { atom } from 'jotai';

/**
 * Represents the display variants for the DeviceCompromisedBanner.
 * - 'none': Banner is hidden
 * - 'brief': Shows banner with only title
 * - 'extended': Shows banner with title, subtitle and CTA
 */
type DeviceCompromisedBannerVariant = 'none' | 'brief' | 'extended';

export const deviceCompromisedBannerAtom = atom<DeviceCompromisedBannerVariant>('none');
