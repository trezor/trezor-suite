import { types, trezorUtils, CoinSelectionError } from '@fivebinaries/coin-selection';

import type { PrecomposedTransactionCardano } from '@suite-common/wallet-types';
import {
    Params,
    Response,
    CardanoCertificate,
    AccountAddresses,
    AccountUtxo,
} from '@trezor/connect';

import type { getAddressParameters } from './cardanoUtils';

import { composeTxPlan } from './cardanoConnectUtils';

type Tx = PrecomposedTransactionCardano & {
    deposit?: string;
};

type CardanoComposeTransaction = (
    params: Params<{
        account: {
            descriptor: string;
            addresses: AccountAddresses;
            utxo: AccountUtxo[];
        };
        feeLevels?: { feePerUnit?: string }[];
        outputs?: types.UserOutput[];
        certificates?: CardanoCertificate[];
        withdrawals?: types.Withdrawal[];
        changeAddress: { address: string; path: string };
        addressParameters: ReturnType<typeof getAddressParameters>;
        testnet?: boolean;
    }>,
) => Response<Tx[]>;

export const cardanoComposeTransaction: CardanoComposeTransaction = async ({
    account,
    feeLevels = [{}],
    outputs = [],
    certificates = [],
    withdrawals = [],
    changeAddress,
    addressParameters,
    testnet,
}) => {
    await Promise.resolve();

    const payload = feeLevels.map<Tx>(({ feePerUnit }) => {
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
                              account.utxo!, // for some reason TS still considers 'undefined' as possible value
                          ),
                          outputs: trezorUtils.transformToTrezorOutputs(
                              txPlan.outputs,
                              addressParameters,
                          ),
                          unsignedTx: txPlan.tx,
                      }),
            };
        } catch (error) {
            if (error instanceof CoinSelectionError && error.code === 'UTXO_BALANCE_INSUFFICIENT') {
                return {
                    type: 'error',
                    error: 'UTXO_BALANCE_INSUFFICIENT',
                    errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
                };
            }
            if (error instanceof CoinSelectionError && error.code === 'UTXO_VALUE_TOO_SMALL') {
                return {
                    type: 'error',
                    error: 'UTXO_VALUE_TOO_SMALL',
                    errorMessage: { id: 'AMOUNT_IS_TOO_LOW' },
                };
            }
            // generic handling for the rest of CoinSelectionError and other unexpected errors
            return {
                type: 'error',
                error: error.message,
            };
        }
    });

    return { success: true, payload };
};
