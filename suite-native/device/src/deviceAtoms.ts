import { atom } from 'jotai';

export const wasDeviceOnboardingCancelledAtom = atom<boolean>(false);
export const isOnboardingDeviceDisconnectedAlertDisplayedAtom = atom<boolean>(false);

export type DeviceDangerBannerCause = 'device-compromised' | 'backup-needed' | 'backup-failed';

type DeviceDangerBanner =
    | {
          variant: 'brief' | 'extended';
          cause: DeviceDangerBannerCause;
      }
    | {
          cause: 'device-compromised';
          variant: 'other-error';
      };

/**
 * Represents the display variants for the DeviceCompromisedBanner.
 * - 'brief': Shows banner with only title
 * - 'extended': Shows banner with title, subtitle and CTA
 * - 'other-error': Shows only a warning banner that check could not be performed
 */
export type DeviceDangerBannerVariant = DeviceDangerBanner['variant'];

export const deviceDangerBannerAtom = atom<DeviceDangerBanner | null>(null);
