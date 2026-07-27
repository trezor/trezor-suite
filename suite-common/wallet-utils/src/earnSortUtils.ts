import {
    type AccountType,
    type NetworkSymbol,
    networkSymbolCollection,
    networks,
} from '@suite-common/wallet-config';
import { BigNumber, type BigNumberValue, typedObjectKeys } from '@trezor/utils';

// Canonical position of a network in the coin list (networkSymbolCollection order).
const getNetworkOrder = (symbol: NetworkSymbol) => networkSymbolCollection.indexOf(symbol);

export type EarnNetworkTokenSortKey = {
    symbol: NetworkSymbol;
    tokenSymbol?: string;
    accountType?: AccountType;
    index?: number;
};

/**
 * Groups items by network only (in networkSymbolCollection order). Pair it with a stable
 * secondary amount sort (see compareEarnByAmountDesc) so that the within-network order is
 * controlled by the balance/deposited amount.
 */
export const compareEarnByNetwork =
    <T>(getSymbol: (item: T) => NetworkSymbol | undefined) =>
    (a: T, b: T) => {
        const symbolA = getSymbol(a);
        const symbolB = getSymbol(b);

        if (!symbolA || !symbolB) {
            return 0;
        }

        return getNetworkOrder(symbolA) - getNetworkOrder(symbolB);
    };

/**
 * Groups items by network → token symbol → account type → account index. Keeps items on the
 * same network and token together regardless of account type (normal/legacy/ledger).
 */
export const compareEarnByNetworkTokenOrder =
    <T>(getKey: (item: T) => EarnNetworkTokenSortKey | undefined) =>
    (a: T, b: T) => {
        const keyA = getKey(a);
        const keyB = getKey(b);

        if (!keyA || !keyB) {
            return 0;
        }

        const networkOrderDiff = getNetworkOrder(keyA.symbol) - getNetworkOrder(keyB.symbol);
        if (networkOrderDiff !== 0) {
            return networkOrderDiff;
        }

        if (keyA.tokenSymbol && keyB.tokenSymbol && keyA.tokenSymbol !== keyB.tokenSymbol) {
            return keyA.tokenSymbol.localeCompare(keyB.tokenSymbol);
        }

        if (keyA.accountType && keyB.accountType && keyA.accountType !== keyB.accountType) {
            // `network` is a union over all networks (some declare `accountTypes: {}`), which would
            // collapse `keyof` to `never`; widening to the field's declared keyset yields
            // `AccountType[]` soundly.
            const orderedAccountTypes = typedObjectKeys(
                networks[keyA.symbol].accountTypes as Partial<Record<AccountType, unknown>>,
            );

            return (
                orderedAccountTypes.indexOf(keyA.accountType) -
                orderedAccountTypes.indexOf(keyB.accountType)
            );
        }

        return (keyA.index ?? 0) - (keyB.index ?? 0);
    };

/**
 * Sorts by amount in descending order (highest first). The amount is compared with BigNumber
 * so token balances of arbitrary precision are handled correctly.
 */
export const compareEarnByAmountDesc =
    <T>(getAmount: (item: T) => BigNumberValue) =>
    (a: T, b: T) =>
        new BigNumber(getAmount(b)).comparedTo(getAmount(a)) ?? 0;

/**
 * Sorts opportunities by APY in descending order (highest first). Items without an APY
 * (null/undefined) are pushed to the end.
 */
export const compareEarnByApyDesc =
    <T>(getApy: (item: T) => number | null | undefined) =>
    (a: T, b: T) => {
        const apyA = getApy(a) ?? -Infinity;
        const apyB = getApy(b) ?? -Infinity;

        if (apyA === apyB) {
            return 0;
        }

        return apyB - apyA;
    };
