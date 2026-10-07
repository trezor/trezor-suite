import { type Result, err, ok } from '@trezor/type-utils';

import type { EthereumSweepLedger, SignedEthereumSweepRecord } from './ethereumSweepLedger';
import { diagnosticLog } from '../app/diagnosticLog';
import type { BackendError, EthereumBackend } from '../backend/backend';
import type { DeviceSession } from '../device/deviceSession';
import { type EthereumAddressError, getEthereumAddress } from '../device/ethereumAddress';
import { toBigEndianHex } from '../ethereum/bigEndianBytes';
import type { EthereumSweepPlan } from '../ethereum/composeEthereumSweep';
import { describeEthereumAccount } from '../ethereum/ethereumAccount';
import { toEthereumAddressInfo } from '../ethereum/ethereumAccountInfo';
import { getEthereumAddressBytes } from '../ethereum/ethereumDestination';
import {
    type SignedEthereumSweepError,
    verifySignedEthereumSweep,
} from '../ethereum/verifySignedEthereumSweep';

export type SignEthereumSweepError =
    /** This exact transaction was already sent to the device once. It must be recomposed. */
    | { type: 'plan-already-attempted' }
    /** A signed transaction for this address and nonce exists. It can only be broadcast again. */
    | { type: 'nonce-already-signed' }
    /** The backend now reports the address differently than when the plan was composed. */
    | { type: 'account-changed'; reason: 'nonce' | 'balance' | 'in-flight' }
    /** The device now derives a different address for the path than the one that was scanned. */
    | { type: 'address-mismatch' }
    /** The device asked for transaction data. A plain transfer carries none. */
    | { type: 'unexpected-data-request' }
    | SignedEthereumSweepError
    | EthereumAddressError
    | BackendError;

export type SignEthereumSweepParams = {
    session: DeviceSession;
    backend: EthereumBackend;
    ledger: EthereumSweepLedger;
    plan: EthereumSweepPlan;
};

/**
 * Signs one composed sweep on the device. Every check that protects the funds runs here, in
 * this order, and any failure stops before the device is asked to sign:
 *
 * 1. the plan was never sent to the device before and its nonce has no signed transaction;
 * 2. the backend still reports the nonce and the balance the plan was composed from, and no
 *    transaction of the address in flight;
 * 3. the device still derives the address that was scanned.
 *
 * After signing, the signature is checked to produce exactly the planned transaction, signed by
 * the address being emptied.
 */
export const signEthereumSweep = async ({
    session,
    backend,
    ledger,
    plan,
}: SignEthereumSweepParams): Promise<Result<SignedEthereumSweepRecord, SignEthereumSweepError>> => {
    const { account } = plan;
    const log = (message: string, details?: Record<string, unknown>) =>
        diagnosticLog.info('sign', message, {
            account: describeEthereumAccount(account),
            ...details,
        });

    if (ledger.findSigned(account.address, plan.nonce)) {
        return err({ type: 'nonce-already-signed' });
    }
    if (ledger.hasAttempted(plan)) return err({ type: 'plan-already-attempted' });
    log('ledger checks passed', { nonce: plan.nonce });

    const accountInfo = await backend.getAccountInfo(account.address);
    if (!accountInfo.success) return accountInfo;

    const info = toEthereumAddressInfo(accountInfo.payload);
    if (info.unconfirmedTransactions > 0) {
        return err({ type: 'account-changed', reason: 'in-flight' });
    }
    if (info.nonce !== String(plan.nonce)) return err({ type: 'account-changed', reason: 'nonce' });
    if (info.balance !== plan.balance) return err({ type: 'account-changed', reason: 'balance' });
    log('fresh address state matches the plan');

    // Asked last, right before signing: the passphrase cache of the device may have been
    // reset since discovery, and a different passphrase would silently select another wallet.
    const currentAddress = await getEthereumAddress({ call: session.call, path: account.path });
    if (!currentAddress.success) return currentAddress;
    if (currentAddress.payload.toLowerCase() !== account.address.toLowerCase()) {
        diagnosticLog.error('sign', 'the device derives a different address than scanned');

        return err({ type: 'address-mismatch' });
    }
    log('address confirmed by the device');

    // The user may confirm the transfer on the device even if signing fails afterwards, so the
    // plan is spent the moment it is sent. A retry needs a new plan with a fresh nonce and fee.
    ledger.markAttempted(plan);
    log('EthereumSignTx started', { chainId: plan.chainId });
    const signingStartedAt = Date.now();

    // Integers travel as big-endian bytes without leading zeros; the destination as 20 bytes.
    const signed = await session.call('EthereumSignTx', 'EthereumTxRequest', {
        address_n: account.path,
        nonce: toBigEndianHex(plan.nonce),
        gas_price: toBigEndianHex(BigInt(plan.gasPrice)),
        gas_limit: toBigEndianHex(BigInt(plan.gasLimit)),
        to: getEthereumAddressBytes(plan.destination.address),
        value: toBigEndianHex(BigInt(plan.amount)),
        chain_id: plan.chainId,
    });

    const leaveNothingHalfDone = async () => {
        // Leaves no half-finished signing behind on the device. The outcome is irrelevant.
        await session.call('Initialize', 'Features');
    };

    if (!signed.success) {
        diagnosticLog.error('sign', 'EthereumSignTx failed', {
            durationMs: Date.now() - signingStartedAt,
            ...signed.error,
        });
        if (signed.error.type !== 'device-lost') await leaveNothingHalfDone();

        return signed;
    }
    log('EthereumSignTx finished', { durationMs: Date.now() - signingStartedAt });

    const { data_length, signature_v, signature_r, signature_s } = signed.payload.message;
    if (data_length) {
        diagnosticLog.error('sign', 'the device asked for transaction data', {
            dataLength: data_length,
        });
        await leaveNothingHalfDone();

        return err({ type: 'unexpected-data-request' });
    }
    if (
        typeof signature_v !== 'number' ||
        typeof signature_r !== 'string' ||
        typeof signature_s !== 'string'
    ) {
        return err({ type: 'signed-transaction-invalid', reason: 'signature missing' });
    }

    const verified = await verifySignedEthereumSweep({
        plan,
        signature: { v: signature_v, r: signature_r, s: signature_s },
    });
    if (!verified.success) {
        diagnosticLog.error('sign', 'signed transaction differs from the plan', {
            reason: verified.error.reason,
        });

        return verified;
    }
    log('signed transaction verified');

    const record: SignedEthereumSweepRecord = { ...verified.payload, plan };
    ledger.recordSigned(record);

    return ok(record);
};
