import type { ComposeUtxo, FeeLevel, GetTrezorConnectDep } from '@trezor/connect-common';
import { DEFAULT_SORTING_STRATEGY } from '@trezor/connect-common/src/constants/utxo';
import {
    ChainSendError,
    type ComposeFeeLevelsParams,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    formatCoinAmount,
    getComposeFailureNotice,
    getRequestedFeeLevels,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import { BTC_LOCKTIME_SEQUENCE, BTC_RBF_SEQUENCE } from './bitcoinSendConstants';
import { getBitcoinComposeOutputs, getUtxoOutpoint } from './bitcoinSendHelpers';
import type { BitcoinSendConfig } from './types';

export type ComposeBitcoinFeeLevelsDeps = GetTrezorConnectDep<'composeTransaction' | 'composePsbt'>;

export type ComposeBitcoinFeeLevelsParams = ComposeFeeLevelsParams & { config: BitcoinSendConfig };

export type ComposeBitcoinFeeLevels = (
    params: ComposeBitcoinFeeLevelsParams,
) => Promise<PrecomposedLevels>;

/**
 * Bitcoin-like fee levels from coin selection over the spendable UTXOs. When no level is
 * affordable, the cheapest affordable fee down to the network minimum becomes the custom level.
 * Selection errors the user can fix come back with a message to show; other errors without one.
 */
export const createComposeBitcoinFeeLevels =
    (deps: ComposeBitcoinFeeLevelsDeps): ComposeBitcoinFeeLevels =>
    async ({ account, draft, context, config }) => {
        const { symbol, accountType } = account;
        const { excludedUtxos, feeInfo, prison } = context;
        const connect = deps.getTrezorConnect();

        const isSatoshis =
            !!context.isSmallestUnitEnabled && config.hasAccountFeature(accountType, 'amount-unit');

        if (!account.addresses || !account.utxo) {
            throw new ChainSendError(
                'compose-failed',
                symbol,
                'Account is missing addresses or utxos.',
            );
        }

        const composeOutputs = getBitcoinComposeOutputs(draft, config.decimals, isSatoshis);
        if (composeOutputs.length < 1 && !draft.transactionData) {
            throw new ChainSendError('compose-failed', symbol, 'Unable to compose output.');
        }

        const predefinedLevels = getRequestedFeeLevels(feeInfo, draft);

        let sequence: number | undefined; // Must be undefined for final (non-RBF) transaction with no locktime
        if (config.hasAccountFeature(accountType, 'rbf')) {
            sequence = BTC_RBF_SEQUENCE;
        } else if (draft.bitcoinLocktimeBlockHeight || draft.bitcoinLocktimeDatetime) {
            sequence = BTC_LOCKTIME_SEQUENCE;
        }

        // exclude unspendable utxos if coin control is not enabled
        // unspendable utxos are defined in `useSendForm` hook
        const utxo = draft.isCoinControlEnabled
            ? draft.selectedUtxos?.map(u => ({ ...u, required: true }))
            : account.utxo.filter((u: ComposeUtxo) => {
                  const outpoint = getUtxoOutpoint(u);

                  return u.required || (!excludedUtxos?.[outpoint] && !prison?.[outpoint]);
              });

        // certain change addresses might be temporary blocked by coinjoin process
        // exclude addresses which exists in "prison" dataset (see coinjoinReducer/selectRegisteredUtxosByAccountKey)
        const changeAddresses = prison
            ? account.addresses.change.filter(a => !prison[a.address])
            : account.addresses.change;

        const params = {
            account: {
                path: account.path,
                addresses: {
                    ...account.addresses,
                    change: changeAddresses,
                },
                utxo,
            },
            feeLevels: predefinedLevels,
            baseFee: draft.baseFee,
            sequence,
            outputs: composeOutputs,
            sortingStrategy: draft.rbfParams !== undefined ? 'none' : DEFAULT_SORTING_STRATEGY,
            coin: toCoinSymbol(symbol),
        } as const satisfies Parameters<typeof connect.composeTransaction>[0];

        const resultLevels: PrecomposedLevels = {};

        if (draft.transactionData) {
            const psbtResponse = await connect.composePsbt({
                account: {
                    addresses: {
                        ...account.addresses,
                        change: changeAddresses,
                    },
                    utxo: utxo ?? [],
                },
                coin: toCoinSymbol(symbol),
                psbtData: draft.transactionData,
            });

            if (!psbtResponse.success) {
                throw new ChainSendError(
                    'compose-failed',
                    symbol,
                    psbtResponse.error.message,
                    psbtResponse.error.code,
                    getComposeFailureNotice(psbtResponse.error.code),
                );
            }

            const feeLabel = draft.selectedFee || 'normal';
            resultLevels[feeLabel] = psbtResponse.payload;
        } else {
            const response = await connect.composeTransaction(params);

            if (!response.success) {
                throw new ChainSendError(
                    'compose-failed',
                    symbol,
                    response.error.message,
                    response.error.code,
                    getComposeFailureNotice(response.error.code),
                );
            }

            response.payload.forEach((tx, index) => {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
                const feeLabel = predefinedLevel.label;
                resultLevels[feeLabel] = tx as PrecomposedTransaction;
            });

            const hasAtLeastOneValid = response.payload.find(r => r.type !== 'error');
            // there is no valid tx in predefinedLevels and there is no custom level
            if (!hasAtLeastOneValid && !resultLevels.custom) {
                const { minFee } = feeInfo;
                const lastIndex = predefinedLevels.length - 1;
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const lastLevel: (typeof predefinedLevels)[number] = predefinedLevels[lastIndex];
                const lastKnownFee = lastLevel.feePerUnit;
                // define coefficient for maxFee
                // NOTE: DOGE has very large values of FeeLevels, up to several thousands sat/B, rangeGap should be greater in this case otherwise calculation takes too long
                // TODO: calculate rangeGap more precisely (percentage of range?)
                const range = new BigNumber(lastKnownFee).minus(minFee);
                const rangeGap = range.gt(1000) ? 1000 : 1;
                let maxFee = new BigNumber(lastKnownFee).minus(rangeGap);
                // generate custom levels in range from lastKnownFee minus customGap to feeInfo.minFee (coinInfo in @trezor/connect)
                const customLevels: FeeLevel[] = [];
                while (maxFee.gte(minFee)) {
                    customLevels.push({
                        feePerUnit: maxFee.toString(),
                        label: 'custom',
                        blocks: -1,
                    });
                    maxFee = maxFee.minus(rangeGap);
                }

                // check if any custom level is possible
                const customLevelsResponse =
                    customLevels.length > 0
                        ? await connect.composeTransaction({
                              ...params,
                              feeLevels: customLevels,
                          })
                        : ({ success: false } as const);

                if (customLevelsResponse.success) {
                    const customValid = customLevelsResponse.payload.findIndex(
                        r => r.type !== 'error',
                    );
                    if (customValid >= 0) {
                        resultLevels.custom = customLevelsResponse.payload[
                            customValid
                        ] as PrecomposedTransaction;
                    }
                }
            }
        }

        // format max (@trezor/connect sends it as satoshi)
        // format errorMessage, leaving unexpected errors (other than AMOUNT_IS_NOT_ENOUGH) to the app
        Object.keys(resultLevels).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const tx: (typeof resultLevels)[string] = resultLevels[key];

            if (tx.type !== 'error') {
                // round to
                tx.feePerByte = new BigNumber(tx.feePerByte).decimalPlaces(2).toString();
                if (typeof tx.max === 'string') {
                    tx.max = isSatoshis ? tx.max : formatCoinAmount(tx.max, config.decimals);
                }
            } else if (['MISSING-UTXOS', 'NOT-ENOUGH-FUNDS'].includes(tx.error)) {
                const getErrorMessage = () => {
                    const isLowAnonymity =
                        accountType === 'coinjoin' &&
                        excludedUtxos &&
                        !!Object.values(excludedUtxos).filter(reason => reason === 'low-anonymity')
                            .length;

                    if (isLowAnonymity && !draft.isCoinControlEnabled) {
                        return 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING';
                    }

                    return draft.isCoinControlEnabled
                        ? 'TR_NOT_ENOUGH_SELECTED'
                        : 'AMOUNT_IS_NOT_ENOUGH';
                };

                tx.errorMessage = { id: getErrorMessage() };
            }
        });

        return resultLevels;
    };
