import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import * as tronUtils from '@trezor/network-tron/utils';

import { isEarnSigningCancelled } from '../../../earn/earnTransactionAnalytics';
import { type TronStakingContract } from '../adapter/types';
import { type TronStakeError } from '../tronStakingTypes';

type SignTronContractResult = { serializedTx: string; txid: string } | { error: TronStakeError };
type SignTronContractParams = {
    account: Account;
    device: TrezorDevice;
    contract: TronStakingContract;
};

export const signTronContract = async ({
    account,
    device,
    contract,
}: SignTronContractParams): Promise<SignTronContractResult> => {
    const blockchainInfo = await TrezorConnect.blockchainGetInfo({
        coin: asCoinSymbol(account.symbol),
        identity: getAccountIdentity(account),
    });

    if (!blockchainInfo.success) {
        return { error: { kind: 'sign-failed', message: blockchainInfo.error.message } };
    }

    const { blockHash, blockHeight } = blockchainInfo.payload;

    const composed = await TrezorConnect.tronComposeTransaction({
        contract,
        blockHash,
        blockHeight,
    });

    if (!composed.success) {
        return { error: { kind: 'sign-failed', message: composed.error.message } };
    }

    const { ref_block_bytes, ref_block_hash, expiration, timestamp } = composed.payload;

    const signed = await TrezorConnect.tronSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
            useEmptyPassphrase: device.useEmptyPassphrase,
        },
        path: account.path,
        ref_block_bytes,
        ref_block_hash,
        expiration,
        timestamp,
        contract: [contract],
    });

    if (!signed.success) {
        if (isEarnSigningCancelled(signed.error)) {
            return { error: { kind: 'cancelled' } };
        }

        return { error: { kind: 'sign-failed', message: signed.error.message } };
    }

    if (!signed.payload.serializedTx || !signed.payload.rawDataHex) {
        return { error: { kind: 'sign-failed', message: 'Failed to serialize transaction.' } };
    }

    return {
        serializedTx: signed.payload.serializedTx,
        txid: tronUtils.tronTxIdFromRawData(signed.payload.rawDataHex),
    };
};
