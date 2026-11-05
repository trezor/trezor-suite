import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { type TradingExchangeAllowanceToken } from './useTradingExchangeAllowanceFlow';

// Enough to tell an allowance apart from the swap amount, short enough for 18-decimal tokens.
export const ALLOWANCE_DISPLAYED_DECIMALS = 6;

type TradingExchangeAllowanceAmountProps = {
    /** Token units. */
    amount: string;
    token: TradingExchangeAllowanceToken;
    isSymbolShown?: boolean;
    'data-testid'?: string;
};

export const TradingExchangeAllowanceAmount = ({
    amount,
    token,
    isSymbolShown = true,
    'data-testid': dataTest,
}: TradingExchangeAllowanceAmountProps) => (
    <FormattedCryptoAmount
        value={amount}
        symbol={isSymbolShown ? token.symbol : undefined}
        contractAddress={token.contractAddress}
        tokenDecimals={token.decimals}
        maxDisplayedDecimals={ALLOWANCE_DISPLAYED_DECIMALS}
        data-testid={dataTest}
    />
);
