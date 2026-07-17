import type { TranslationKey } from '@suite/intl';
import type { Account } from '@suite-common/wallet-types';
import { Model } from '@trezor/trezor-user-env-link';

import type { NormalizedDisplayContent } from '../helpers/displayContentNormalizedParser';

type LineFormats = 'fourTetragrams' | 'evmTetragrams' | 'cardanoTetragrams' | 'fullLine';

type TranslationMatcherOptions = {
    isValueElement?: boolean;
    values?: Record<string, string | number>;
    timeout?: number;
};

declare global {
    namespace PlaywrightTest {
        interface Matchers<R, _T = unknown> {
            toHaveTextGreaterThan(expectedValue: number): Promise<R>;
            toHaveTextLessThan(expectedValue: number): Promise<R>;
            toHavePayload(expectedPayload: unknown, options?: { omit: string[] }): Promise<R>;
            toShowReceiveAddress(
                expectedAddress: string,
                options?: { lineFormat: LineFormats },
            ): Promise<R>;
            toShowOnDisplay(expected: {
                [Model.T3W1]: NormalizedDisplayContent;
                [Model.T3T1]?: Partial<NormalizedDisplayContent>;
            }): Promise<R>;
            toHaveTranslation(
                translationKey: TranslationKey | TranslationKey[],
                options?: TranslationMatcherOptions,
            ): Promise<R>;
            toContainTranslation(
                translationKey: TranslationKey,
                options?: TranslationMatcherOptions,
            ): Promise<R>;
            toHaveValidAddress(symbol: Account['symbol']): Promise<R>;
            toHaveLoadedImage(options?: { timeout?: number }): Promise<R>;
        }
    }
}

export {};
