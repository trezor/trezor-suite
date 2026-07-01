import type {
    AddToastDep,
    ComposeTransactionFeeLevels,
    GetAreSatsAmountUnitDep,
    GetSelectedDeviceDep,
} from '@network-module/suite-types';

import { BTC_LOCKTIME_SEQUENCE, BTC_RBF_SEQUENCE } from '@suite-common/wallet-constants';
import type {
    Account,
    ComposeActionContext,
    FormState,
    PrecomposedLevels,
    PrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getBitcoinComposeOutputs,
    getUtxoOutpoint,
    hasNetworkFeatures,
} from '@suite-common/wallet-utils';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary bridge until Bitcoin compose dependencies are moved into the network module.
import TrezorConnect, {
    type ComposeUtxo,
    DEFAULT_SORTING_STRATEGY,
    type FeeLevel,
} from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

export type CreateComposeBitcoinTransactionFeeLevelsDeps = AddToastDep &
    GetAreSatsAmountUnitDep &
    GetSelectedDeviceDep;

type GetSequenceParams = { account: Account; formValues: FormState };

const getSequence = ({ account, formValues }: GetSequenceParams) => {
    if (hasNetworkFeatures(account, 'rbf')) {
        return BTC_RBF_SEQUENCE;
    }

    if (formValues.bitcoinLocktimeBlockHeight || formValues.bitcoinLocktimeDatetime) {
        return BTC_LOCKTIME_SEQUENCE;
    }

    return undefined;
};

export const createComposeBitcoinTransactionFeeLevels =
    (deps: CreateComposeBitcoinTransactionFeeLevelsDeps): ComposeTransactionFeeLevels<string> =>
    async ({ formState, composeContext }) => {
        const typedFormState = formState as FormState;
        const typedComposeContext = composeContext as ComposeActionContext;
        const { account, excludedUtxos, feeInfo, prison } = typedComposeContext;

        const areSatsAmountUnit = deps.getAreSatsAmountUnit();
        const device = deps.getSelectedDevice();

        const isSatoshis =
            areSatsAmountUnit &&
            !device?.unavailableCapabilities?.amountUnit &&
            hasNetworkFeatures(account, 'amount-unit');

        if (!account.addresses || !account.utxo) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Account is missing addresses or utxos.',
            };
        }

        const composeOutputs = getBitcoinComposeOutputs(typedFormState, account.symbol, isSatoshis);

        if (composeOutputs.length < 1) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            };
        }

        const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
        if (typedFormState.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: typedFormState.feePerUnit,
                blocks: -1,
            });
        }

        const sequence = getSequence({ account, formValues: typedFormState });

        const utxo = typedFormState.isCoinControlEnabled
            ? typedFormState.selectedUtxos?.map(u => ({ ...u, required: true }))
            : account.utxo.filter((u: ComposeUtxo) => {
                  const outpoint = getUtxoOutpoint(u);

                  return u.required || (!excludedUtxos?.[outpoint] && !prison?.[outpoint]);
              });

        const changeAddresses = prison
            ? account.addresses.change.filter(a => !prison[a.address])
            : account.addresses.change;

        const params: Parameters<typeof TrezorConnect.composeTransaction>[0] = {
            account: {
                path: account.path,
                addresses: {
                    ...account.addresses,
                    change: changeAddresses,
                },
                utxo,
            },
            feeLevels: predefinedLevels,
            baseFee: typedFormState.baseFee,
            sequence,
            outputs: composeOutputs,
            sortingStrategy:
                typedFormState.rbfParams !== undefined ? 'none' : DEFAULT_SORTING_STRATEGY,
            coin: account.symbol,
        };

        const response = await TrezorConnect.composeTransaction(params);

        if (!response.success) {
            if (response.error.code !== 'Method_InvalidParameter') {
                deps.addToast({
                    type: 'sign-tx-error',
                    error: response.error.message,
                });
            }

            return {
                error: 'fee-levels-compose-failed',
                message: response.error.message,
            };
        }

        const resultLevels: PrecomposedLevels = {};
        response.payload.forEach((tx, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label;
            resultLevels[feeLabel] = tx as PrecomposedTransaction;
        });

        const hasAtLeastOneValid = response.payload.find(r => r.type !== 'error');
        if (!hasAtLeastOneValid && !resultLevels.custom) {
            const { minFee } = feeInfo;
            const lastIndex = predefinedLevels.length - 1;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const lastLevel: (typeof predefinedLevels)[number] = predefinedLevels[lastIndex];
            const lastKnownFee = lastLevel.feePerUnit;
            const range = new BigNumber(lastKnownFee).minus(minFee);
            const rangeGap = range.gt(1000) ? 1000 : 1;
            let maxFee = new BigNumber(lastKnownFee).minus(rangeGap);
            const customLevels: FeeLevel[] = [];

            while (maxFee.gte(minFee)) {
                customLevels.push({
                    feePerUnit: maxFee.toString(),
                    label: 'custom',
                    blocks: -1,
                });
                maxFee = maxFee.minus(rangeGap);
            }

            const customLevelsResponse =
                customLevels.length > 0
                    ? await TrezorConnect.composeTransaction({
                          ...params,
                          account: params.account,
                          feeLevels: customLevels,
                      })
                    : ({ success: false } as const);

            if (customLevelsResponse.success) {
                const customValid = customLevelsResponse.payload.findIndex(r => r.type !== 'error');

                if (customValid >= 0) {
                    resultLevels.custom = customLevelsResponse.payload[
                        customValid
                    ] as PrecomposedTransaction;
                }
            }
        }

        Object.keys(resultLevels).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const tx: (typeof resultLevels)[string] = resultLevels[key];

            if (tx.type !== 'error') {
                tx.feePerByte = new BigNumber(tx.feePerByte).decimalPlaces(2).toString();

                if (typeof tx.max === 'string') {
                    tx.max = isSatoshis ? tx.max : formatNetworkAmount(tx.max, account.symbol);
                }
            } else if (['MISSING-UTXOS', 'NOT-ENOUGH-FUNDS'].includes(tx.error)) {
                const getErrorMessage = () => {
                    const isLowAnonymity =
                        account.accountType === 'coinjoin' &&
                        excludedUtxos &&
                        !!Object.values(excludedUtxos).filter(reason => reason === 'low-anonymity')
                            .length;

                    if (isLowAnonymity && !typedFormState.isCoinControlEnabled) {
                        return 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING';
                    }

                    return typedFormState.isCoinControlEnabled
                        ? 'TR_NOT_ENOUGH_SELECTED'
                        : 'AMOUNT_IS_NOT_ENOUGH';
                };

                tx.errorMessage = { id: getErrorMessage() };
            } else {
                deps.addToast({
                    type: 'sign-tx-error',
                    error: 'message' in tx ? tx.message : tx.error,
                });
            }
        });

        return resultLevels;
    };
