import { BigNumber } from '@trezor/utils';

const DUST_DECIMAL_PLACES = 5;

const DUST_BASE_CURRENCY_VALUE = new BigNumber('0.01');

export const getCryptoDustLimit = (decimals: number | undefined) =>
    new BigNumber(10).pow(-Math.min(decimals ?? DUST_DECIMAL_PLACES, DUST_DECIMAL_PLACES));

export const isCryptoDustAmount = ({
    cryptoBalance,
    decimals,
}: {
    cryptoBalance: BigNumber | string;
    decimals: number | undefined;
}) => new BigNumber(cryptoBalance).abs().lt(getCryptoDustLimit(decimals));

export const isDustBalance = ({
    cryptoBalance,
    decimals,
    fiatValue,
}: {
    cryptoBalance: BigNumber | string;
    decimals: number | undefined;
    fiatValue: BigNumber | undefined;
}) =>
    fiatValue === undefined
        ? isCryptoDustAmount({ cryptoBalance, decimals })
        : fiatValue.abs().lt(DUST_BASE_CURRENCY_VALUE);
