import { type NetworkType } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { validateDecimals, validateInteger } from '#src/utils/suite/validation';

import { type CustomFeeBasicProps } from './CustomFeeBasicProps';
import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } from './constants';

type GetCustomFeeEthereumRulesParams = Pick<
    CustomFeeBasicProps,
    'translationString' | 'sharedRules'
> & {
    feeInfo: Pick<FeeInfo, 'maxFee' | 'minFee' | 'minPriorityFee'>;
    networkType: NetworkType;
    getValues: (
        name: 'estimatedFeeLimit' | typeof MAX_FEE_PER_GAS | typeof MAX_PRIORITY_FEE_PER_GAS,
    ) => string | undefined;
};

export const getCustomFeeEthereumRules = ({
    translationString,
    sharedRules,
    feeInfo: { maxFee, minFee, minPriorityFee },
    networkType,
    getValues,
}: GetCustomFeeEthereumRulesParams) => {
    // The EIP-1559 fields are optional in the form state, so their validators accept `undefined`.
    const getRangeError = (value = '') => {
        const fee = new BigNumber(value);

        if (fee.isGreaterThan(maxFee) || fee.isLessThan(minFee)) {
            return translationString('CUSTOM_FEE_NOT_IN_RANGE', {
                minFee: new BigNumber(minFee).toString(),
                maxFee: new BigNumber(maxFee).toString(),
            });
        }
    };

    const validateGweiDecimals = validateDecimals(translationString, {
        decimals: 9,
        except: networkType !== 'ethereum',
    });
    const ethereumDecimalsLimit = (value = '') => validateGweiDecimals(value);

    const gasLimitRules = {
        required: translationString('GAS_LIMIT_IS_NOT_SET'),
        validate: {
            integer: validateInteger(translationString, {}),
            positive: (value: string) => {
                if (new BigNumber(value).isZero()) {
                    return translationString('GAS_LIMIT_IS_NOT_SET');
                }
            },
            feeLimit: (value: string) => {
                const estimatedFeeLimit = getValues('estimatedFeeLimit');
                if (estimatedFeeLimit && new BigNumber(value).lt(estimatedFeeLimit)) {
                    return translationString('CUSTOM_FEE_LIMIT_BELOW_RECOMMENDED');
                }
            },
        },
    };

    const gasPriceRules = {
        ...sharedRules,
        validate: {
            ethereumDecimalsLimit,
            range: getRangeError,
        },
    };

    const maxFeePerGasRules = {
        ...sharedRules,
        validate: {
            ethereumDecimalsLimit,
            customMaxFeePerGasRange: getRangeError,
            customMaxFeePerGasLowerThanPriority: (value = '') => {
                const customMaxPriorityFeePerGas = getValues(MAX_PRIORITY_FEE_PER_GAS);

                if (
                    customMaxPriorityFeePerGas &&
                    new BigNumber(value).isLessThan(customMaxPriorityFeePerGas)
                ) {
                    return translationString('CUSTOM_MAX_LOWER_THAN_PRIORITY');
                }
            },
        },
    };

    const maxPriorityFeePerGasRules = {
        ...sharedRules,
        validate: {
            ethereumDecimalsLimit,
            customPriorityFeePerGas: (value = '') => {
                const customPriorityFeePerGas = new BigNumber(value);
                const customMaxFeePerGas = getValues(MAX_FEE_PER_GAS);

                if (customMaxFeePerGas && customPriorityFeePerGas.gt(customMaxFeePerGas)) {
                    return translationString('CUSTOM_PRIORITY_HIGHER_THAN_MAX');
                }

                if (customPriorityFeePerGas.lt(minPriorityFee)) {
                    return translationString('CUSTOM_MAX_PRIORITY_FEE_NOT_IN_RANGE', {
                        minPriorityFee: new BigNumber(minPriorityFee).toString(),
                    });
                }
            },
        },
    };

    return { gasLimitRules, gasPriceRules, maxFeePerGasRules, maxPriorityFeePerGasRules };
};
