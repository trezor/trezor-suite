import { NATIVE_CURRENCY, decodeClearSignedSwap } from '@suite-common/calldata';
import { BigNumber } from '@trezor/utils';

import { convertAmountSubunitsToUnits } from './amountUtils';

// Applies the caller's decimals only when the calldata token matches — a mismatch means
// the calldata pays out a different asset than the quote, so it must not be shown.

export type ClearSignedSwapTokenMeta = {
    contractAddress?: string; // undefined for the native currency
    decimals: number;
};

export type ClearSignedSwapAmounts = {
    sendAmount?: string;
    receiveAmount?: string;
};

const legMatchesToken = (legToken: string, meta: ClearSignedSwapTokenMeta): boolean => {
    if (legToken === NATIVE_CURRENCY) {
        return !meta.contractAddress;
    }
    if (!meta.contractAddress) {
        return false;
    }

    return legToken.toLowerCase() === meta.contractAddress.toLowerCase();
};

const formatLeg = (
    leg: { amount: bigint; token: string },
    meta: ClearSignedSwapTokenMeta | undefined,
): string | undefined => {
    if (!meta || !legMatchesToken(leg.token, meta)) {
        return undefined;
    }

    if (!Number.isInteger(meta.decimals) || meta.decimals < 0) {
        return undefined;
    }

    const formatted = convertAmountSubunitsToUnits(leg.amount.toString(), meta.decimals);

    if (leg.amount > 0n && new BigNumber(formatted).isZero()) {
        return undefined;
    }

    return formatted;
};

type GetClearSignedSwapAmountsParams = {
    transactionData?: string;
    value?: bigint; // tx value in wei, required for native-spending ethUnoswap* selectors
    send?: ClearSignedSwapTokenMeta;
    receive?: ClearSignedSwapTokenMeta;
};

export const getClearSignedSwapAmounts = ({
    transactionData,
    value,
    send,
    receive,
}: GetClearSignedSwapAmountsParams): ClearSignedSwapAmounts | undefined => {
    const decoded = decodeClearSignedSwap(transactionData, value);
    if (!decoded) {
        return undefined;
    }

    const sendAmount = formatLeg(decoded.send, send);
    const receiveAmount = decoded.receive ? formatLeg(decoded.receive, receive) : undefined;
    // A truthy result must mean "something was decoded AND matched": callers keying
    // on it would otherwise render blank amounts for a mismatched/unresolved token.
    if (sendAmount === undefined && receiveAmount === undefined) {
        return undefined;
    }

    return { sendAmount, receiveAmount };
};
