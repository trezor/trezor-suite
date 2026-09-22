import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkDecimalsWithFallback } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, HiddenPlaceholder } from 'src/components/suite';

type TradingBalanceProps = {
    balance: string | undefined;
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress | undefined;
    showOnlyAmount?: boolean;
    isInSats?: boolean;
    decimals?: number;
};

export const TradingBalance = ({
    balance,
    symbol,
    tokenAddress,
    showOnlyAmount,
    isInSats,
    decimals = getNetworkDecimalsWithFallback(symbol),
}: TradingBalanceProps) => {
    const { CryptoAmountFormatter } = useFormatters();
    const amount = balance && !isNaN(Number(balance)) ? balance : '0';
    const amountInUnits = isInSats
        ? subunitsToUnits({ value: asAmountSubunit(new BigNumber(amount)), decimals }).toString()
        : amount;

    if (showOnlyAmount) {
        return (
            <Text
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                overflowWrap="anywhere"
            >
                <BaseCurrencyValue
                    amount={amountInUnits}
                    symbol={symbol}
                    tokenAddress={tokenAddress}
                    rateType="current"
                />
            </Text>
        );
    }

    return (
        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
            <Translation id="TR_BALANCE" />
            {': '}
            <HiddenPlaceholder>
                <CryptoAmountFormatter
                    value={amountInUnits}
                    symbol={symbol}
                    tokenDecimals={tokenAddress ? decimals : undefined}
                    withSymbol={false}
                    formatStyle="compact-balance"
                    isBalance
                />
            </HiddenPlaceholder>
        </Text>
    );
};
