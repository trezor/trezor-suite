import { type PermissionRequest } from '@trezor/connect-common';
import {
    type CardanoComposeTransactionParams,
    CardanoComposeTransactionParamsSchema,
    type PrecomposedTransactionCardano,
} from '@trezor/connect-common/src/types/api/cardano/cardanoComposeTransaction';
import cardano from '@trezor/network-cardano/runtime';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getCoinSelectionParams } from '../cardanoUtils';

export default class CardanoComposeTransaction extends AbstractMethod<
    'cardanoComposeTransaction',
    CardanoComposeTransactionParams
> {
    constructor(message: MethodMessage<'cardanoComposeTransaction'>) {
        // validate incoming parameters
        Assert(CardanoComposeTransactionParamsSchema, message.payload);

        super(message, message.payload);
        this.useDevice = false;
        this.useDeviceState = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return 'Compose Cardano transaction';
    }

    async run() {
        const {
            feeLevels = [{}],
            account,
            outputs = [],
            certificates = [],
            withdrawals = [],
            changeAddress,
            addressParameters,
            testnet,
        } = this.params;

        const { trezorUtils, asCoinSelectionError, coinSelection } = await cardano();

        const result = feeLevels.map<PrecomposedTransactionCardano>(({ feePerUnit }) => {
            try {
                const txPlan = coinSelection(
                    getCoinSelectionParams(
                        account.descriptor,
                        account.utxo,
                        outputs,
                        certificates,
                        withdrawals,
                        changeAddress.address,
                        !!testnet,
                    ),
                    { feeParams: feePerUnit ? { a: feePerUnit } : undefined },
                );

                return {
                    fee: txPlan.fee,
                    feePerByte: feePerUnit ?? '0',
                    deposit: txPlan.deposit,
                    totalSpent: txPlan.totalSpent,
                    max: txPlan.max,
                    ...(txPlan.type === 'nonfinal'
                        ? {
                              type: txPlan.type,
                              bytes: 0,
                          }
                        : {
                              type: txPlan.type,
                              bytes: txPlan.tx.size,
                              ttl: txPlan.ttl,
                              inputs: trezorUtils.transformToTrezorInputs(
                                  txPlan.inputs,
                                  account.utxo,
                              ),
                              outputs: trezorUtils.transformToTrezorOutputs(
                                  txPlan.outputs,
                                  addressParameters,
                              ),
                              unsignedTx: txPlan.tx,
                          }),
                };
            } catch (error) {
                if (asCoinSelectionError(error)?.code === 'UTXO_BALANCE_INSUFFICIENT') {
                    return { type: 'error', error: 'UTXO_BALANCE_INSUFFICIENT' };
                }
                if (asCoinSelectionError(error)?.code === 'UTXO_VALUE_TOO_SMALL') {
                    return { type: 'error', error: 'UTXO_VALUE_TOO_SMALL' };
                }

                // generic handling for the rest of CoinSelectionError and other unexpected errors
                return { type: 'error', error: error.message };
            }
        });

        return result;
    }
}
