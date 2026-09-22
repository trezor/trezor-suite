import { BigNumber } from '@trezor/utils';

/**
 * How little of an asset counts as dust.
 *
 * Two answers, because there are two questions. What an amount is worth is the one that matters,
 * so it is asked first; a holding nothing can price is judged by how little of it there is, down
 * to the smallest amount the UI prints (`0.00001`), and never below one unit of the token itself.
 */
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

export const isDustHolding = ({
    cryptoBalance,
    decimals,
    fiatValue,
}: {
    cryptoBalance: BigNumber | string;
    decimals: number | undefined;
    /** What the holding is worth, when anything can say. */
    fiatValue: BigNumber | undefined;
}) =>
    fiatValue === undefined
        ? isCryptoDustAmount({ cryptoBalance, decimals })
        : fiatValue.abs().lt(DUST_BASE_CURRENCY_VALUE);
