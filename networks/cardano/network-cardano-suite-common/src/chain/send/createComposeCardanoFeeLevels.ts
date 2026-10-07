import type { GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ComposeFeeLevelsParams,
    type PrecomposedLevelsCardano,
    type PrecomposedTransactionCardano,
} from '@trezor/network-module-suite-common-types';

import {
    formatMaxOutputAmount,
    getAddressParameters,
    getUnusedChangeAddress,
    transformUserOutputs,
} from './cardanoSendUtils';
import type { CardanoSendConfig } from './types';

export type ComposeCardanoFeeLevelsDeps = GetTrezorConnectDep<'cardanoComposeTransaction'>;

export type ComposeCardanoFeeLevelsParams = ComposeFeeLevelsParams & { config: CardanoSendConfig };

export type ComposeCardanoFeeLevels = (
    params: ComposeCardanoFeeLevelsParams,
) => Promise<PrecomposedLevelsCardano>;

/**
 * Cardano fee levels from coin selection over the account's UTXOs, change going to its first
 * unused change address. Selection errors the user can fix come back with a message to show;
 * other errors come back without one.
 */
export const createComposeCardanoFeeLevels =
    (deps: ComposeCardanoFeeLevelsDeps): ComposeCardanoFeeLevels =>
    async ({ account, draft, context, config }) => {
        const changeAddress = getUnusedChangeAddress(account);
        if (!changeAddress || !account.utxo || !account.addresses) {
            throw new ChainSendError(
                'compose-failed',
                account.symbol,
                'Change address, utxos or addresses are missing.',
            );
        }

        const predefinedLevels = context.feeInfo.levels.filter(l => l.label !== 'custom');
        if (draft.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: draft.feePerUnit,
                blocks: -1,
            });
        }

        const outputs = transformUserOutputs(
            draft.outputs,
            account.tokens,
            config.decimals,
            draft.setMaxOutputId,
        );

        const addressParameters = getAddressParameters(account, changeAddress.path);

        const response = await deps.getTrezorConnect().cardanoComposeTransaction({
            feeLevels: predefinedLevels,
            outputs,
            account: {
                descriptor: account.descriptor,
                utxo: account.utxo,
            },
            changeAddress,
            addressParameters,
            testnet: config.isTestnet,
        });

        if (!response.success) {
            throw new ChainSendError(
                'compose-failed',
                account.symbol,
                response.error.message,
                response.error.code,
            );
        }

        const resultLevels: PrecomposedLevelsCardano = {};
        response.payload.forEach((t, index) => {
            const tx: PrecomposedTransactionCardano = t;
            switch (tx.type) {
                case 'final':
                    // convert from lovelace units to ADA
                    tx.max = formatMaxOutputAmount(
                        tx.max,
                        outputs.find(o => o.setMax),
                        account,
                        config.decimals,
                    );
                    break;
                case 'nonfinal':
                    // convert lovelace to ADA (for ADA outputs only)
                    tx.max = formatMaxOutputAmount(
                        tx.max,
                        outputs.find(o => o.setMax && o.assets.length === 0),
                        account,
                        config.decimals,
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
                        // no default: the app reports errors the user cannot fix
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
