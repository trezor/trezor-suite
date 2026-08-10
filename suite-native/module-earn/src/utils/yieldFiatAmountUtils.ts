import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type TokenAddress, toTokenAddress } from '@suite-common/wallet-types';
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
