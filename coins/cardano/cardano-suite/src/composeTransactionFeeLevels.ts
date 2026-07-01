import type { AddToastDep, ComposeTransactionFeeLevels } from '@network-module/suite-types';

import type {
    ComposeActionContext,
    FormState,
    PrecomposedLevelsCardano,
    PrecomposedTransactionCardano,
} from '@suite-common/wallet-types';
import {
    formatMaxOutputAmount,
    getAddressParameters,
    getUnusedChangeAddress,
    isTestnet,
    transformUserOutputs,
} from '@suite-common/wallet-utils';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary bridge until Cardano compose dependencies are moved into the network module.
import TrezorConnect from '@trezor/connect';

export type CreateComposeCardanoTransactionFeeLevelsDeps = AddToastDep;

export const createComposeCardanoTransactionFeeLevels =
    (deps: CreateComposeCardanoTransactionFeeLevelsDeps): ComposeTransactionFeeLevels<string> =>
    async ({ formState, composeContext }) => {
        const typedFormState = formState as FormState;
        const typedComposeContext = composeContext as ComposeActionContext;
        const { account, feeInfo } = typedComposeContext;
        const changeAddress = getUnusedChangeAddress(account);

        if (!changeAddress || !account.utxo || !account.addresses) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Change address, utxos or addresses are missing.',
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

        const outputs = transformUserOutputs(
            typedFormState.outputs,
            account.tokens,
            account.symbol,
            typedFormState.setMaxOutputId,
        );

        const addressParameters = getAddressParameters(account, changeAddress.path);

        const response = await TrezorConnect.cardanoComposeTransaction({
            feeLevels: predefinedLevels,
            outputs,
            account: {
                descriptor: account.descriptor,
                utxo: account.utxo,
            },
            changeAddress,
            addressParameters,
            testnet: isTestnet(account.symbol),
        });

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

        const resultLevels: PrecomposedLevelsCardano = {};
        response.payload.forEach((t, index) => {
            const tx: PrecomposedTransactionCardano = t;

            switch (tx.type) {
                case 'final':
                    tx.max = formatMaxOutputAmount(
                        tx.max,
                        outputs.find(o => o.setMax),
                        account,
                    );
                    break;
                case 'nonfinal':
                    tx.max = formatMaxOutputAmount(
                        tx.max,
                        outputs.find(o => o.setMax && o.assets.length === 0),
                        account,
                    );
                    break;
                case 'error':
                    switch (tx.error) {
                        case 'UTXO_BALANCE_INSUFFICIENT':
                            tx.errorMessage = { id: 'AMOUNT_IS_NOT_ENOUGH' };
                            break;
                        case 'UTXO_VALUE_TOO_SMALL':
                            tx.errorMessage = { id: 'AMOUNT_IS_TOO_LOW' };
                            break;
                        default:
                            deps.addToast({
                                type: 'sign-tx-error',
                                error: tx.error,
                            });
                            break;
                    }
                    break;
                // no default
            }

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label;
            resultLevels[feeLabel] = tx;
        });

        return resultLevels;
    };
