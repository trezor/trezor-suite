import { G } from '@mobily/ts-belt';

import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { Account } from '@suite-common/wallet-types';
import {
    getConvertedOrDefaultFeeInfo,
    isTestnet,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import {
    buildAddTrustlineTransaction,
    buildRemoveTrustlineTransaction,
} from '@trezor/blockchain-link-stellar/src/utils';
import TrezorConnect from '@trezor/connect';
import { StellarAssetType } from '@trezor/protobuf/src/messages';

import { selectRawNetworkFeeInfo } from '../fees/feesReducer';

export interface TokenThunkPayload {
    account: Account;
    contractAddress: string;
    selectedFee: string;
    customFeePerUnit?: string;
}

const STELLAR_TOKEN_MODULE_PREFIX = '@common/wallet-core/stellar-token';

const manageTrustline = async (
    payload: TokenThunkPayload,
    operation: 'activate' | 'deactivate',
    getState: () => any,
    rejectWithValue: (value: any) => any,
) => {
    const { account, contractAddress, selectedFee, customFeePerUnit } = payload;
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

    const [code, issuer] = contractAddress.split('-');

    const asset = {
        type: code.length <= 4 ? StellarAssetType.ALPHANUM4 : StellarAssetType.ALPHANUM12,
        code,
        issuer,
    };

    // Build the appropriate trustline transaction
    const misc = account.misc as { stellarSequence: string };
    const transactionBuilder =
        operation === 'activate' ? buildAddTrustlineTransaction : buildRemoveTrustlineTransaction;

    const transaction = transactionBuilder({
        descriptor: account.descriptor,
        sequence: misc.stellarSequence,
        fee: feePerUnit,
        asset,
        isTestnet: isTestnet(account.symbol),
    });

    const limit =
        operation === 'activate'
            ? '9223372036854775807' // max int64 in stroops for activation
            : '0'; // 0 to deactivate trustline

    const response = await TrezorConnect.stellarSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
            useEmptyPassphrase: device.useEmptyPassphrase,
        },
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
                    limit,
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
                message: pushResponse.error.message,
            });
        }
    } else {
        return rejectWithValue({
            error: 'sign-transaction-failed',
            message: response.error.message,
        });
    }
};

export const activateStellarTokenThunk = createThunk<
    void,
    TokenThunkPayload,
    { rejectValue: { error: string; message: string } }
>(
    `${STELLAR_TOKEN_MODULE_PREFIX}/activateStellarTokenThunk`,
    (payload, { getState, rejectWithValue }) =>
        manageTrustline(payload, 'activate', getState, rejectWithValue),
);

export const deactivateStellarTokenThunk = createThunk<
    void,
    TokenThunkPayload,
    { rejectValue: { error: string; message: string } }
>(
    `${STELLAR_TOKEN_MODULE_PREFIX}/deactivateStellarTokenThunk`,
    (payload, { getState, rejectWithValue }) =>
        manageTrustline(payload, 'deactivate', getState, rejectWithValue),
);
