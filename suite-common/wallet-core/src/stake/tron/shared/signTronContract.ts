import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import * as tronUtils from '@trezor/network-tron/utils';

import { type TronClaimContract } from '../actions/claim/claimContract';
import { type TronFreezeContract } from '../actions/freeze/freezeContract';
import { type TronUnstakeContract } from '../actions/unstake/unstakeContract';
import { type TronVoteContract } from '../actions/vote/voteContract';
import { type TronWithdrawContract } from '../actions/withdraw/withdrawContract';
import { type TronStakeError } from '../tronStakeTypes';

type TronStakeContract =
    | TronFreezeContract
    | TronUnstakeContract
    | TronVoteContract
    | TronWithdrawContract
    | TronClaimContract;

type SignTronContractResult = { serializedTx: string; txid: string } | { error: TronStakeError };

export const signTronContract = async ({
    account,
    device,
    contract,
}: {
    account: Account;
    device: TrezorDevice;
    contract: TronStakeContract;
}): Promise<SignTronContractResult> => {
    const blockchainInfo = await TrezorConnect.blockchainGetInfo({
        coin: account.symbol,
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
        const { code } = signed.error;

        if (code === 'Failure_ActionCancelled' || code === 'Method_Cancel') {
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
