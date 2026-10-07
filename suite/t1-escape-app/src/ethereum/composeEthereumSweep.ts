import { type Result, err, ok } from '@trezor/type-utils';

import type { EthereumAccount } from './ethereumAccount';
import { ETHEREUM_CHAIN_DEFINITIONS } from './ethereumChain';
import type { EthereumDestination } from './ethereumDestination';

/** Gas a plain value transfer between externally owned accounts consumes. */
export const ETHEREUM_TRANSFER_GAS_LIMIT = 21_000n;

/**
 * The backend estimate is raised by this fraction so that the transaction is not stuck behind a
 * rising gas price while the user confirms it on the device.
 */
export const GAS_PRICE_MARGIN = { numerator: 6n, denominator: 5n };

/**
 * Gas price no composed transaction may exceed, in wei per gas (500 gwei). Composition fails
 * rather than let a lying backend make the fee eat the balance.
 */
export const MAX_GAS_PRICE_WEI = 500_000_000_000n;

export type EthereumSweepPlan = {
    /** The address being emptied. The signed transaction must come from it. */
    account: EthereumAccount;
    chainId: number;
    nonce: number;
    /** Balance of the address the plan was composed for, in wei. The whole of it is spent. */
    balance: string;
    /** In wei per gas. */
    gasPrice: string;
    gasLimit: string;
    /** `gasLimit` times `gasPrice`, in wei. */
    fee: string;
    /** `balance` minus `fee`, in wei. */
    amount: string;
    destination: EthereumDestination;
};

export type ComposeEthereumSweepError =
    /** The backend data is not a non-negative integer where one is required. */
    | { type: 'invalid-backend-data'; field: 'balance' | 'nonce' | 'gasPrice' }
    /** A transaction of the address is still in the mempool. Its nonce and balance are unsettled. */
    | { type: 'transaction-in-flight' }
    | { type: 'nothing-to-move' }
    /** The balance does not cover the fee of the transaction that would move it. */
    | { type: 'insufficient-for-fee'; balance: string; fee: string }
    | { type: 'gas-price-too-high'; gasPrice: string };

export type ComposeEthereumSweepParams = {
    account: EthereumAccount;
    /** In wei, as reported by the backend. */
    balance: string;
    /** Next nonce of the address, as reported by the backend. */
    nonce: string;
    /** Pending transactions of the address, as reported by the backend. */
    unconfirmedTransactions: number;
    /** Backend fee estimate in wei per gas. */
    gasPriceEstimate: string;
    destination: EthereumDestination;
};

const INTEGER_PATTERN = /^\d+$/;

const parseInteger = (value: string) => (INTEGER_PATTERN.test(value) ? BigInt(value) : undefined);

const MAX_NONCE = BigInt(Number.MAX_SAFE_INTEGER);

/** The backend estimate with the margin applied, rounded up to a whole wei. */
export const getGasPriceWithMargin = (estimate: bigint) => {
    const { numerator, denominator } = GAS_PRICE_MARGIN;

    return (estimate * numerator + denominator - 1n) / denominator;
};

/**
 * Composes the transaction that moves the whole balance of one address to the destination: a
 * plain value transfer with a fixed gas limit, paying the backend's gas price plus a margin.
 * Nothing is composed while a transaction of the address is still in flight, because the nonce
 * and the balance the backend reports may change when it settles.
 */
export const composeEthereumSweep = ({
    account,
    balance,
    nonce,
    unconfirmedTransactions,
    gasPriceEstimate,
    destination,
}: ComposeEthereumSweepParams): Result<EthereumSweepPlan, ComposeEthereumSweepError> => {
    const balanceWei = parseInteger(balance);
    if (balanceWei === undefined) return err({ type: 'invalid-backend-data', field: 'balance' });

    if (unconfirmedTransactions > 0) return err({ type: 'transaction-in-flight' });
    if (balanceWei === 0n) return err({ type: 'nothing-to-move' });

    const nonceValue = parseInteger(nonce);
    if (nonceValue === undefined || nonceValue > MAX_NONCE) {
        return err({ type: 'invalid-backend-data', field: 'nonce' });
    }

    const estimateWei = parseInteger(gasPriceEstimate);
    if (estimateWei === undefined || estimateWei === 0n) {
        return err({ type: 'invalid-backend-data', field: 'gasPrice' });
    }

    const gasPrice = getGasPriceWithMargin(estimateWei);
    if (gasPrice > MAX_GAS_PRICE_WEI) {
        return err({ type: 'gas-price-too-high', gasPrice: gasPrice.toString() });
    }

    const fee = ETHEREUM_TRANSFER_GAS_LIMIT * gasPrice;
    if (balanceWei <= fee) {
        return err({ type: 'insufficient-for-fee', balance, fee: fee.toString() });
    }

    return ok({
        account,
        chainId: ETHEREUM_CHAIN_DEFINITIONS[account.chain].chainId,
        nonce: Number(nonceValue),
        balance,
        gasPrice: gasPrice.toString(),
        gasLimit: ETHEREUM_TRANSFER_GAS_LIMIT.toString(),
        fee: fee.toString(),
        amount: (balanceWei - fee).toString(),
        destination,
    });
};
