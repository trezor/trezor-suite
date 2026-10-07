import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import type { BackendError, EthereumBackend } from '../backend/backend';
import {
    type ComposeEthereumSweepError,
    type EthereumSweepPlan,
    composeEthereumSweep,
} from '../ethereum/composeEthereumSweep';
import type { EthereumAccount } from '../ethereum/ethereumAccount';
import { type EthereumAddressInfo, toEthereumAddressInfo } from '../ethereum/ethereumAccountInfo';
import type { EthereumDestination } from '../ethereum/ethereumDestination';

export type EthereumLeftover = {
    /** The balance does not cover the fee of the transaction that would move it. */
    reason: 'insufficient-for-fee';
    balance: string;
    fee: string;
};

export type PreparedEthereumSweep = {
    /** The transaction to sign, or undefined when nothing can be moved right now. */
    plan?: EthereumSweepPlan;
    leftover?: EthereumLeftover;
    /** A transaction of the address is still in the mempool. Composition waits for it. */
    isInFlight: boolean;
    info: EthereumAddressInfo;
};

export type PrepareEthereumSweepError =
    | BackendError
    | Extract<ComposeEthereumSweepError, { type: 'invalid-backend-data' | 'gas-price-too-high' }>;

export type PrepareEthereumSweepParams = {
    backend: EthereumBackend;
    account: EthereumAccount;
    destination: EthereumDestination;
};

/**
 * Composes the sweep of one address from a fresh backend snapshot and the current gas price, so
 * that every attempt carries the nonce and the fee of the moment it is made.
 */
export const prepareEthereumSweep = async ({
    backend,
    account,
    destination,
}: PrepareEthereumSweepParams): Promise<
    Result<PreparedEthereumSweep, PrepareEthereumSweepError>
> => {
    const accountInfo = await backend.getAccountInfo(account.address);
    if (!accountInfo.success) return accountInfo;

    const info = toEthereumAddressInfo(accountInfo.payload);

    const gasPriceEstimate = await backend.estimateGasPrice();
    if (!gasPriceEstimate.success) return gasPriceEstimate;

    const composed = composeEthereumSweep({
        account,
        balance: info.balance,
        nonce: info.nonce ?? '',
        unconfirmedTransactions: info.unconfirmedTransactions,
        gasPriceEstimate: gasPriceEstimate.payload,
        destination,
    });
    if (composed.success) return ok({ plan: composed.payload, isInFlight: false, info });

    const { error } = composed;
    switch (error.type) {
        case 'transaction-in-flight':
            return ok({ isInFlight: true, info });
        case 'nothing-to-move':
            return ok({ isInFlight: false, info });
        case 'insufficient-for-fee':
            return ok({
                leftover: {
                    reason: 'insufficient-for-fee',
                    balance: error.balance,
                    fee: error.fee,
                },
                isInFlight: false,
                info,
            });
        case 'invalid-backend-data':
        case 'gas-price-too-high':
            return err(error);
        default:
            return exhaustive(error);
    }
};
