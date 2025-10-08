import { G } from '@mobily/ts-belt';

import { createThunk } from '@suite-common/redux-utils';
import { selectRawNetworkFeeInfo, selectSelectedDevice } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    getConvertedOrDefaultFeeInfo,
    isTestnet,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { buildAddTrustlineTransaction } from '@trezor/blockchain-link-utils/src/stellar';
import TrezorConnect from '@trezor/connect';
import { StellarAssetType } from '@trezor/protobuf/src/messages';

export interface ActivateTokenThunkPayload {
    account: Account;
    contractAddress: string;
    selectedFee: string;
    customFeePerUnit?: string;
}

const MODULE_PREFIX = '@wallet-actions/token';

export const activateTokenThunk = createThunk<
    void, // No return value needed, success is indicated by fulfilled state
    ActivateTokenThunkPayload,
    { rejectValue: { error: string; message: string } }
>(
    `${MODULE_PREFIX}/activateTokenThunk`,
    async (
        { account, contractAddress, selectedFee, customFeePerUnit },
        { getState, rejectWithValue },
    ) => {
        const device = selectSelectedDevice(getState());
        const rawFeeInfo = selectRawNetworkFeeInfo(getState(), account.symbol);
        if (G.isNullable(account) || !device || !rawFeeInfo) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid input data.',
            });
        }

        const feeInfo = getConvertedOrDefaultFeeInfo({
            networkType: account.networkType,
            feeInfo: rawFeeInfo,
        });

        let feePerUnit: string;
        if (selectedFee === 'custom' && customFeePerUnit) {
            feePerUnit = customFeePerUnit;
        } else {
            const feeLevel = feeInfo.levels.find(level => level.label === selectedFee);
            if (!feeLevel) {
                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Invalid input data.',
                });
            }
            feePerUnit = feeLevel.feePerUnit;
        }

        try {
            const [code, issuer] = contractAddress.split('-');

            const asset = {
                type: code.length <= 4 ? StellarAssetType.ALPHANUM4 : StellarAssetType.ALPHANUM12,
                code,
                issuer,
            };

            // Build the trustline transaction
            const misc = account.misc as { stellarSequence: string };
            const transaction = buildAddTrustlineTransaction(
                account.descriptor,
                misc.stellarSequence,
                feePerUnit,
                asset,
                isTestnet(account.symbol),
            );

            // Sign the transaction using TrezorConnect
            const response = await TrezorConnect.stellarSignTransaction({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                },
                useEmptyPassphrase: device.useEmptyPassphrase,
                path: account.path,
                networkPassphrase: transaction.networkPassphrase,
                transaction: {
                    source: transaction.source,
                    fee: Number.parseInt(transaction.fee, 10),
                    sequence: transaction.sequence,
                    memo: { type: 0 },
                    timebounds: {
                        minTime: 0,
                        maxTime: 0,
                    },
                    operations: [
                        {
                            type: 'changeTrust',
                            line: asset,
                            limit: '9223372036854775807', // max int64 in stroops
                        },
                    ],
                },
            });

            if (response.success) {
                const signature = Buffer.from(response.payload.signature, 'hex').toString('base64');
                transaction.addSignature(account.descriptor, signature);
                const serializedTx = transaction.toEnvelope().toXDR('hex');

                // Submit transaction to the network
                const pushResponse = await TrezorConnect.pushTransaction({
                    tx: serializedTx,
                    coin: account.symbol,
                    identity: tryGetAccountIdentity(account),
                });

                if (pushResponse.success) {
                    return;
                } else {
                    return rejectWithValue({
                        error: 'sign-transaction-failed',
                        message: pushResponse.payload.error,
                    });
                }
            } else {
                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: response.payload.error,
                });
            }
        } catch (error) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: error.message,
            });
        }
    },
);
