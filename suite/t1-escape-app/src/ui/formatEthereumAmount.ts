const WEI_PER_ETHER = 10n ** 18n;

const WEI_PER_GWEI = 10n ** 9n;

const INTEGER_PATTERN = /^\d+$/;

const formatUnits = (amount: bigint, unit: bigint, decimals: number) => {
    const whole = amount / unit;
    const fraction = (amount % unit).toString().padStart(decimals, '0').replace(/0+$/, '');

    return fraction === '' ? `${whole}` : `${whole}.${fraction}`;
};

/**
 * Formats an amount in wei as ether with the trailing zeros removed, e.g. `0.0499 ETH`. Amounts
 * shown on screen can come straight from the backend, so a malformed one is reported as such
 * instead of breaking the page.
 */
export const formatEthereumAmount = (wei: string | bigint, symbol: string) => {
    if (typeof wei === 'string' && !INTEGER_PATTERN.test(wei)) return 'unknown amount';

    return `${formatUnits(BigInt(wei), WEI_PER_ETHER, 18)} ${symbol}`;
};

/** Formats a gas price in wei per gas as gwei, e.g. `24 gwei`. */
export const formatGasPrice = (wei: string | bigint) => {
    if (typeof wei === 'string' && !INTEGER_PATTERN.test(wei)) return 'unknown gas price';

    return `${formatUnits(BigInt(wei), WEI_PER_GWEI, 9)} gwei`;
};

export type FormatTokenAmountParams = {
    balance: string;
    decimals: number;
    symbol?: string;
};

/** Formats an ERC-20 balance with the token's own decimals. */
export const formatTokenAmount = ({ balance, decimals, symbol }: FormatTokenAmountParams) => {
    const label = symbol ?? 'tokens';
    if (!INTEGER_PATTERN.test(balance) || !Number.isInteger(decimals) || decimals < 0) {
        return `unknown amount of ${label}`;
    }

    return `${formatUnits(BigInt(balance), 10n ** BigInt(decimals), decimals)} ${label}`;
};

export const sumWei = (amounts: readonly string[]) =>
    amounts.reduce((sum, amount) => sum + BigInt(amount), 0n);
