import { DeviceModelInternal } from '@trezor/device-utils';

import { isRecoveryInputTypeDisabled } from './recoveryUtils';
import { type WordCount } from './types';

const NON_T1B1_MODELS = [
    DeviceModelInternal.T2T1,
    DeviceModelInternal.T2B1,
    DeviceModelInternal.T3B1,
    DeviceModelInternal.T3T1,
    DeviceModelInternal.T3W1,
] as const;

const ALL_MODELS = [DeviceModelInternal.T1B1, ...NON_T1B1_MODELS] as const;
const ALL_WORD_COUNTS: WordCount[] = [12, 18, 24];

describe('isRecoveryInputTypeDisabled', () => {
    it.each(ALL_MODELS)('advanced input type is never disabled (%s)', model => {
        ALL_WORD_COUNTS.forEach(wordCount => {
            expect(isRecoveryInputTypeDisabled(model, wordCount, 'advanced')).toBe(false);
        });
    });

    it.each([12, 18] as const)(
        'standard input type is disabled for T1B1 with %i words (lower entropy)',
        wordCount => {
            expect(
                isRecoveryInputTypeDisabled(DeviceModelInternal.T1B1, wordCount, 'standard'),
            ).toBe(true);
        },
    );

    it('standard input type is enabled for T1B1 with 24 words (sufficient entropy)', () => {
        expect(isRecoveryInputTypeDisabled(DeviceModelInternal.T1B1, 24, 'standard')).toBe(false);
    });

    it.each(NON_T1B1_MODELS)(
        'standard input type is never disabled on non-T1B1 devices (%s)',
        model => {
            ALL_WORD_COUNTS.forEach(wordCount => {
                expect(isRecoveryInputTypeDisabled(model, wordCount, 'standard')).toBe(false);
            });
        },
    );
});
