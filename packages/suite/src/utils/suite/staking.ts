import { type TranslationFunction } from '@suite/intl';
import { BigNumber } from '@trezor/utils';

interface ValidateMaxOptions {
    maxAmount: BigNumber;
    except?: boolean;
}

export const validateStakingMax =
    (translationString: TranslationFunction, { except, maxAmount }: ValidateMaxOptions) =>
    (value: string) => {
        if (!except && value && BigNumber(value).gt(maxAmount)) {
            return translationString('AMOUNT_EXCEEDS_MAX', {
                maxAmount: maxAmount.toString(),
            });
        }
    };
