import { DeviceModelInternal } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

import { type RecoveryInputType, type WordCount } from './types';

const WORD_COUNT_12 = 12 as const;
const WORD_COUNT_18 = 18 as const;

/**
 * Determines if a specific recovery type should be disabled for a given device and word count.
 *
 * For Trezor Model One (T1B1):
 * - Standard recovery is disabled for 12 and 18-word seeds (lower security)
 * - Standard recovery is enabled for 24-word seeds (sufficient entropy)
 * - Advanced recovery is always available for all word counts
 */
export const isRecoveryInputTypeDisabled = (
    deviceModelInternal: DeviceModelInternal,
    wordCount: WordCount,
    recoveryInputType: RecoveryInputType,
): boolean => {
    switch (recoveryInputType) {
        // Advanced recovery is never disabled
        case 'advanced':
            return false;
        // Only disable Standard recovery for T1B1 with 12 or 18-word seeds
        case 'standard':
            return (
                deviceModelInternal === DeviceModelInternal.T1B1 &&
                (wordCount === WORD_COUNT_12 || wordCount === WORD_COUNT_18)
            );
        default:
            return exhaustive(recoveryInputType);
    }
};
