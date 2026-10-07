import { BigNumber, type BigNumberValue } from '@trezor/utils';

import type { ChainSendDraft } from './ChainSend';
import type { ExternalOutput } from './PrecomposedTransaction';

/** The account's token with the contract, compared case-insensitively. */
export const findToken = <TToken extends { contract: string }>(
    tokens: readonly TToken[] | undefined,
    address?: string | null,
): TToken | undefined => {
    if (!address || !tokens) return;

    return tokens.find(t => t.contract.toLowerCase() === address.toLowerCase());
};

/** Units to the smallest unit, as a string; `-1` when the amount is not a number. */
export const convertAmountUnitsToSubunits = (amount: BigNumberValue, decimals: number) => {
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }

        return bAmount.times(10 ** decimals).toString(10);
    } catch {
        // TODO: return null, so we can decide how to handle missing value in caller component
        return '-1';
    }
};

/** Smallest unit to units, as a string. Throws when the amount is not a number. */
export const convertAmountSubunitsToUnits = (amount: BigNumberValue, decimals: number) => {
    const safeAmount = amount || '0';
    const bAmount = new BigNumber(safeAmount);

    if (bAmount.isNaN()) {
        throw new Error('Amount is not a number');
    }

    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return bAmount.div(factor).toString(10);
};

/** A coin amount in units to its smallest unit; unchanged for a coin without decimals. */
export const coinAmountToSmallestUnit = (amount: string | null, decimals: number) => {
    if (!amount) return '0';

    if (!decimals) return amount;

    return convertAmountUnitsToSubunits(amount, decimals);
};

/** A coin amount in its smallest unit to units; unchanged for a coin without decimals. */
export const formatCoinAmount = (amount: string, decimals: number) => {
    if (!decimals) return amount;

    return convertAmountSubunitsToUnits(amount, decimals);
};

export const calculateTotal = (amount: string, fee: string): string => {
    try {
        const total = new BigNumber(amount).plus(fee);
        if (total.isNaN()) {
            console.error('calculateTotal: Amount is not a number', amount, fee);

            return '0';
        }

        return total.toString();
    } catch (error) {
        console.error('calculateTotal: error', error);

        return '0';
    }
};

export const calculateMax = (availableBalance: string, fee: string): string => {
    try {
        const max = new BigNumber(availableBalance).minus(fee);
        if (max.isNaN()) {
            console.error('calculateMax: Amount is not a number', availableBalance, fee);

            return '0';
        }
        if (max.isLessThan(0)) return '0';

        return max.toFixed();
    } catch (error) {
        console.error('calculateMax: error', error);

        return '0';
    }
};

export type ExternalComposeOutput<TToken> = {
    output: ExternalOutput;
    tokenInfo: TToken | undefined;
    decimals: number;
};

/**
 * The single output account-based networks compose (all but Bitcoin-like), in the smallest unit.
 * `undefined` while the first output is incomplete.
 *
 * @param network Its `decimals` are the coin's, used when the output sends no token.
 * @param formattedFallbackAmount For cases when value is zero but amount is available in eth data.
 */
export const getExternalComposeOutput = <TToken extends { contract: string; decimals: number }>(
    values: Partial<ChainSendDraft>,
    account: { readonly tokens?: readonly TToken[] },
    network: { readonly decimals: number },
    formattedFallbackAmount?: string,
): ExternalComposeOutput<TToken> | undefined => {
    if (!values || !Array.isArray(values.outputs) || !values.outputs[0]) return;
    const out = values.outputs[0];
    if (!out || typeof out !== 'object') return;
    const { address, amount, token, resolvedAddress } = out;

    // A named input (e.g. ENS) keeps what the user typed on `address`, and the transaction has to
    // carry the address it resolved to: that is what gets signed, what the device shows for the
    // user to check the review against, and what identifies the recipient to everything else
    // reading the composed output.
    const recipient = resolvedAddress ?? address;

    const isMaxActive = typeof values.setMaxOutputId === 'number';
    if (!isMaxActive && !amount) return; // incomplete Output

    const tokenInfo = findToken(account.tokens, token);
    const decimals = tokenInfo ? tokenInfo.decimals : network.decimals;
    const formattedAmount = convertAmountUnitsToSubunits(amount, decimals);

    let output: ExternalOutput;
    if (isMaxActive) {
        if (recipient) {
            output = {
                type: 'send-max',
                address: recipient,
                amount: formattedAmount,
            };
        } else {
            output = {
                type: 'send-max-noaddress',
            };
        }
    } else if (recipient) {
        output = {
            type: 'payment',
            address: recipient,
            amount: formattedFallbackAmount || formattedAmount,
        };
    } else {
        output = {
            type: 'payment-noaddress',
            amount: formattedAmount,
        };
    }

    return {
        output,
        tokenInfo,
        decimals,
    };
};
