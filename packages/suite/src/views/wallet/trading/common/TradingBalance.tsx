import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { getNetworkDecimalsWithFallback } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

type TradingBalanceProps = {
    balance: string | undefined;
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress | undefined;
    isInSats?: boolean;
    decimals?: number;
};

export const TradingBalance = ({
    balance,
    symbol,
    tokenAddress,
    isInSats,
    decimals = getNetworkDecimalsWithFallback(symbol),
}: TradingBalanceProps) => {
    const { CryptoAmountFormatter } = useFormatters();
    const amount = balance && !isNaN(Number(balance)) ? balance : '0';
    const amountInUnits = isInSats
        ? subunitsToUnits({ value: asAmountSubunit(new BigNumber(amount)), decimals }).toString()
        : amount;

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
