import { BigNumber } from '@trezor/utils';

import { TranslationFunction } from 'src/hooks/suite/useTranslation';

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

export const calculateGains = (input: string, apy: number, divisor: number) => {
    const amount = new BigNumber(input).multipliedBy(apy).dividedBy(100).dividedBy(divisor);

    return amount.toFixed(5, 1);
};
