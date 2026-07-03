import type {
    ComposeTransactionFeeLevels,
    PrecomposedLevels,
    PrecomposedTransaction,
} from '@network-module/suite-types';

import { getDisplaySymbol } from '@suite-common/wallet-config';
import type { ComposeActionContext, ExternalOutput, FormState } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    calculateMax,
    calculateTotal,
    formatNetworkAmount,
    getExternalComposeOutput,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary bridge until Stellar compose dependencies are moved into the network module.
import TrezorConnect, { type FeeLevel, type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    requiredAmount?: BigNumber,
    token?: TokenInfo,
): PrecomposedTransaction => {
    const feeInSatoshi = feeLevel.feePerUnit;

    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? unitsToSubunits({
              value: asAmountUnit(new BigNumber(token.balance!)),
              decimals: token.decimals,
          }).toString()
        : undefined;

    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInSatoshi);
        amount = max;
    } else {
        amount = output.amount;
    }

    const totalNativeSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInSatoshi));

    if (totalNativeSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';

        return {
            type: 'error',
            error,
            errorMessage: { id: error },
        } as const;
    }

    if (requiredAmount?.gt(amount)) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_LESS_THAN_RESERVE',
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: token ? amount : totalNativeSpent.toString(),
        max,
        token,
        fee: feeInSatoshi,
        feePerByte: feeLevel.feePerUnit,
        bytes: 0,
        inputs: [],
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [
                {
                    address: output.address,
                    amount,
                    script_type: 'PAYTOADDRESS',
                },
            ],
        };
    }

    return payloadData;
};

export const createComposeStellarTransactionFeeLevels =
    (): ComposeTransactionFeeLevels<string> =>
    async ({ formState, composeContext }) => {
        const typedFormState = formState as FormState;
        const typedComposeContext = composeContext as ComposeActionContext;
        const { account, network, feeInfo } = typedComposeContext;
        const composeOutputs = getExternalComposeOutput(typedFormState, account, network);

        if (!composeOutputs) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            };
        }

        const { output, tokenInfo } = composeOutputs;
        const { availableBalance } = account;
        const { outputs: composeOutputsList } = typedFormState;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof composeOutputsList)[number] = composeOutputsList[0];
        const { address } = firstOutput;

        const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');

        if (typedFormState.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: typedFormState.feePerUnit,
                blocks: -1,
            });
        }

        let requiredAmount: BigNumber | undefined;

        if (address) {
            const accountResponse = await TrezorConnect.getAccountInfo({
                descriptor: address,
                coin: account.symbol,
                suppressBackupWarning: true,
            });

            if (accountResponse.success && accountResponse.payload.empty) {
                requiredAmount = new BigNumber(accountResponse.payload.misc!.reserve!);
            }
        }

        const resultLevels: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculate(availableBalance, output, level, requiredAmount, tokenInfo),
        );

        response.forEach((tx, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label;
            resultLevels[feeLabel] = tx;
        });

        const hasAtLeastOneValid = response.find(r => r.type !== 'error');

        if (!hasAtLeastOneValid && !resultLevels.custom) {
            const { minFee } = feeInfo;
            const lastIndex = predefinedLevels.length - 1;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const lastLevel: (typeof predefinedLevels)[number] = predefinedLevels[lastIndex];
            const lastKnownFee = lastLevel.feePerUnit;
            let maxFee = new BigNumber(lastKnownFee).minus(1);
            const customLevels: FeeLevel[] = [];

            while (maxFee.gte(minFee)) {
                customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom', blocks: -1 });
                maxFee = maxFee.minus(1);
            }

            const customLevelsResponse = customLevels.map(level =>
                calculate(availableBalance, output, level, requiredAmount, tokenInfo),
            );

            const customValid = customLevelsResponse.findIndex(r => r.type !== 'error');

            if (customValid >= 0) {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const customResult: (typeof customLevelsResponse)[number] =
                    customLevelsResponse[customValid];
                resultLevels.custom = customResult;
            }
        }

        Object.keys(resultLevels).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const tx: (typeof resultLevels)[string] = resultLevels[key];

            if (tx.type !== 'error' && tx.max) {
                tx.max = formatNetworkAmount(tx.max, account.symbol);
            }

            if (
                tx.type === 'error' &&
                tx.error === 'AMOUNT_IS_LESS_THAN_RESERVE' &&
                requiredAmount
            ) {
                tx.errorMessage = {
                    id: 'AMOUNT_IS_LESS_THAN_RESERVE',
                    values: {
                        reserve: formatNetworkAmount(requiredAmount.toString(), account.symbol),
                        displaySymbol: getDisplaySymbol(account.symbol),
                    },
                };
            }

            if (tx.type === 'error' && tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE') {
                tx.errorMessage = {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                    values: {
                        networkDisplaySymbol: getDisplaySymbol(network.symbol),
                    },
                };
            }
        });

        return resultLevels;
    };
