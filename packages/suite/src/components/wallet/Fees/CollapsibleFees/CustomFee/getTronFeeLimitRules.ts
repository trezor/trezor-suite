import { type TranslationFunction } from '@suite/intl';
import { isInteger } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type GetTronFeeLimitRulesParams = {
    translationString: TranslationFunction;
    minFee: number;
    maxFee: number;
    estimatedFeeLimit?: string;
};

export const getTronFeeLimitRules = ({
    translationString,
    minFee,
    maxFee,
    estimatedFeeLimit,
}: GetTronFeeLimitRulesParams) => ({
    required: translationString('CUSTOM_FEE_IS_NOT_SET'),
    validate: {
        integer: (value: string) => {
            if (!isInteger(value)) {
                return translationString('CUSTOM_FEE_IS_NOT_INTEGER');
            }
        },
        range: (value: string) => {
            const customFee = new BigNumber(value);

            if (customFee.isGreaterThan(maxFee) || customFee.isLessThan(minFee)) {
                return translationString('CUSTOM_FEE_NOT_IN_RANGE', {
                    minFee: new BigNumber(minFee).toString(),
                    maxFee: new BigNumber(maxFee).toString(),
                });
            }
        },
        feeLimit: (value: string) => {
            if (estimatedFeeLimit && new BigNumber(value).lt(estimatedFeeLimit)) {
                return translationString('TR_TRON_FEE_LIMIT_BELOW_RECOMMENDED');
            }
        },
    },
});
