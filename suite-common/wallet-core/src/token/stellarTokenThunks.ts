import { G } from '@mobily/ts-belt';

import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import {
    getConvertedOrDefaultFeeInfo,
    isTestnet,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import stellar from '@trezor/network-stellar/runtime';
import { StellarAssetType } from '@trezor/protobuf/src/definitions';

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

    const contractAddressParts = contractAddress.split('-');
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const [code, issuer]: [string, string] = contractAddressParts;

    const asset = {
        type: code.length <= 4 ? StellarAssetType.ALPHANUM4 : StellarAssetType.ALPHANUM12,
        code,
        issuer,
    };

    const { buildAddTrustlineTransaction, buildRemoveTrustlineTransaction } = await stellar();

    // Build the appropriate trustline transaction
    const misc = account.misc as { stellarSequence: string };
    const transactionBuilder =
        operation === 'activate' ? buildAddTrustlineTransaction : buildRemoveTrustlineTransaction;

    const testnet = isTestnet(account.symbol);
    const transaction = transactionBuilder({
        descriptor: account.descriptor,
        sequence: misc.stellarSequence,
        fee: feePerUnit,
        asset,
        isTestnet: testnet,
    });
    const xdrBase64 = transaction.toXDR();

    const response = await TrezorConnect.stellarSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
            useEmptyPassphrase: device.useEmptyPassphrase,
        },
        path: account.path,
        xdrBase64,
        testnet,
    });

    if (!response.success) {
        return rejectWithValue({
            error: 'sign-transaction-failed',
            message: response.error.message,
        });
    }

    const signature = Buffer.from(response.payload.signature, 'hex').toString('base64');
    transaction.addSignature(account.descriptor, signature);
    const serializedTx = transaction.toEnvelope().toXDR('hex');

    // Submit transaction to the network
    const pushResponse = await TrezorConnect.pushTransaction({
        tx: serializedTx,
        coin: asCoinSymbol(account.symbol),
        identity: tryGetAccountIdentity(account),
    });

    if (!pushResponse.success) {
        return rejectWithValue({
            error: 'sign-transaction-failed',
            message: pushResponse.error.message,
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
