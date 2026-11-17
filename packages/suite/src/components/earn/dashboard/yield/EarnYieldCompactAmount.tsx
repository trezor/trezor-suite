import { useFormatters } from '@suite-common/formatters';
import { useTokenMetadata } from '@suite-common/token';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';

type EarnYieldCompactAmountProps = {
    amount: string;
    token: YieldFlowDisplayToken;
};

/** A compact amount without its symbol, in the token's own decimals. */
export const EarnYieldCompactAmount = ({ amount, token }: EarnYieldCompactAmountProps) => {
    const { CryptoAmountFormatter } = useFormatters();
    const tokenMetadata = useTokenMetadata(token.networkSymbol, token.contractAddress);

    if (!token.contractAddress) {
        return (
            <CryptoAmountFormatter
                value={amount}
                symbol={token.networkSymbol}
                isBalance
                withSymbol={false}
                formatStyle="compact-balance"
            />
        );
    }

    return (
        <CryptoAmountFormatter
            value={amount}
            smallestUnitsOverride={false}
            withSymbol={false}
            formatStyle="compact-balance"
            tokenDecimals={tokenMetadata?.decimals}
        />
    );
};
