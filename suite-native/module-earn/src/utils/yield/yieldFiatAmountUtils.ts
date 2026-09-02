import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import {
    type BaseCurrencyAmount,
    type TokenAddress,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { isDecimalsValid } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type GetFiatFormValueParams = {
    cryptoAmount: string;
    convertCryptoToFiat?: (amount: BigNumber) => BigNumber | null;
    decimals: number;
};

/**
 * Rounds down so re-entering the shown fiat value never converts back above the balance;
 * returns an empty string when there is no rate to convert with.
 */
export const getFiatFormValue = ({
    cryptoAmount,
    convertCryptoToFiat,
    decimals,
}: GetFiatFormValueParams) => {
    if (!cryptoAmount || !convertCryptoToFiat) {
        return '';
    }

    const fiatAmount = convertCryptoToFiat(new BigNumber(cryptoAmount));

    if (!fiatAmount || fiatAmount.isNaN()) {
        return '';
    }

    return fiatAmount.toFixed(decimals, BigNumber.ROUND_DOWN);
};

export const getYieldTokenContract = (
    token: YieldFlowDisplayToken | null,
): TokenAddress | undefined =>
    token?.contractAddress ? toTokenAddress(token.contractAddress) : undefined;

type IsAmountInputValueValidParams = {
    value: string;
    decimals: number;
};

export const isAmountInputValueValid = ({ value, decimals }: IsAmountInputValueValidParams) => {
    if (!value) {
        return true;
    }

    return isDecimalsValid(value, decimals);
};

type GetApproximateFiatAmountParams = {
    cryptoAmount: string;
    convertCryptoToFiat?: (amount: BigNumber) => BaseCurrencyAmount | null;
};

/**
 * Returns null when there's nothing to approximate (empty/invalid/zero amount or missing rate)
 * so callers hide the whole "≈" row — zero also covers the shares→asset '0' fallback when the
 * vault lacks price-per-share.
 */
export const getApproximateFiatAmount = ({
    cryptoAmount,
    convertCryptoToFiat,
}: GetApproximateFiatAmountParams) => {
    if (!cryptoAmount || !convertCryptoToFiat) {
        return null;
    }

    const amount = new BigNumber(cryptoAmount);

    if (amount.isNaN() || amount.isZero()) {
        return null;
    }

    return convertCryptoToFiat(amount);
};
