import { type DeviceRootState, selectAccountSigningDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect from '@trezor/connect';
import { ERRORS, asCoinSymbol } from '@trezor/connect-common';
import * as tronUtils from '@trezor/network-tron/utils';

import { isEarnSigningCancelled } from '../../../earn/earnTransactionAnalytics';
import { type TronClaimContract } from '../actions/claim/claimContract';
import { type TronFreezeContract } from '../actions/freeze/freezeContract';
import { type TronUnstakeContract } from '../actions/unstake/unstakeContract';
import { type TronVoteContract } from '../actions/vote/voteContract';
import { type TronWithdrawContract } from '../actions/withdraw/withdrawContract';
import { type TronStakeError } from '../tronStakingTypes';

type TronStakeContract =
    | TronFreezeContract
    | TronUnstakeContract
    | TronVoteContract
    | TronWithdrawContract
    | TronClaimContract;

type SignTronContractResult = { serializedTx: string; txid: string } | { error: TronStakeError };
type SignTronContractParams = {
    account: Account;
    device: TrezorDevice;
    getState: () => DeviceRootState;
    contract: TronStakeContract;
};

const prepareAndSignTronContract = async ({
    account,
    device,
    getState,
    contract,
}: SignTronContractParams): Promise<SignTronContractResult> => {
    const blockchainInfo = await TrezorBlockchain.getInfo({
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

    const currentDevice = selectAccountSigningDevice(getState(), account.deviceState, device.path);
    if (!currentDevice) {
        return { error: { kind: 'sign-failed', message: ERRORS.ERROR_CODES.Device_NotFound } };
    }

    const signed = await TrezorConnect.tronSignTransaction({
        device: {
            path: currentDevice.path,
            instance: currentDevice.instance,
            state: currentDevice.state,
            useEmptyPassphrase: currentDevice.useEmptyPassphrase,
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

export const signTronContract = (params: SignTronContractParams): Promise<SignTronContractResult> =>
    prepareAndSignTronContract(params).catch(() => ({ error: { kind: 'sign-failed' } }));
