import { trezorUtils, CoinSelectionError } from '@fivebinaries/coin-selection';

import { AssertWeak } from '@trezor/schema-utils';

import { AbstractMethod } from '../../../core/AbstractMethod';
import { composeTxPlan } from '../cardanoUtils';
import {
    CardanoComposeTransactionParamsSchema,
    type CardanoComposeTransactionParams,
    type PrecomposedTransactionCardano,
} from '../../../types/api/cardanoComposeTransaction';

export default class CardanoComposeTransaction extends AbstractMethod<
    'cardanoComposeTransaction',
    CardanoComposeTransactionParams
> {
    init() {
        const { payload } = this;

        // validate incoming parameters
        // TODO: weak assert for compatibility purposes (issue #10841)
        AssertWeak(CardanoComposeTransactionParamsSchema, payload);

        this.useDevice = false;
        this.useDeviceState = false;
        this.useUi = false;

        this.params = payload;
    }

    get info() {
        return 'Compose Cardano transaction';
    }

    run() {
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

        const result = feeLevels.map<PrecomposedTransactionCardano>(({ feePerUnit }) => {
            try {
                const txPlan = composeTxPlan(
                    account.descriptor,
                    account.utxo,
                    outputs,
                    certificates,
                    withdrawals,
                    changeAddress.address,
                    !!testnet,
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
                if (
                    error instanceof CoinSelectionError &&
                    error.code === 'UTXO_BALANCE_INSUFFICIENT'
                ) {
                    return { type: 'error', error: 'UTXO_BALANCE_INSUFFICIENT' };
                }
                if (error instanceof CoinSelectionError && error.code === 'UTXO_VALUE_TOO_SMALL') {
                    return { type: 'error', error: 'UTXO_VALUE_TOO_SMALL' };
                }

                // generic handling for the rest of CoinSelectionError and other unexpected errors
                return { type: 'error', error: error.message };
            }
        });

        return Promise.resolve(result);
    }
}
