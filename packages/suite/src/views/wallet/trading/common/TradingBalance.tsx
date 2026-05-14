import { Translation } from '@suite/intl';
import { getNetworkDecimalsWithFallback } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

import { BaseCurrencyValue, HiddenPlaceholder } from 'src/components/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { tradingGetAccountLabel } from 'src/utils/wallet/trading/tradingUtils';

interface TradingBalanceProps {
    balance: string | undefined;
    symbol: NetworkSymbol;
    displaySymbol: string | undefined;
    tokenAddress?: TokenAddress | undefined;
    showOnlyAmount?: boolean;
    amountInCrypto?: boolean;
    decimals?: number;
}

export const TradingBalance = ({
    balance, // expects a value in full units (BTC not sats)
    symbol,
    displaySymbol,
    tokenAddress,
    showOnlyAmount,
    amountInCrypto,
    decimals: networkDecimals = getNetworkDecimalsWithFallback(symbol),
}: TradingBalanceProps) => {
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const balanceCurrency = tradingGetAccountLabel(displaySymbol ?? '', shouldSendInSats);
    const stringBalance = !isNaN(Number(balance)) ? balance : '0';
    const formattedBalance =
        stringBalance && shouldSendInSats
            ? convertAmountUnitsToSubunits(stringBalance, networkDecimals)
            : stringBalance;

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: stringBalance || '',
        symbol,
        tokenAddress,
        rateType: 'current',
    });

    if (showOnlyAmount) {
        if (Number(balance) === 0 || isNaN(Number(balance))) return null;

        return (
            <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
                {!amountInCrypto ? (
                    <HiddenPlaceholder>
                        &asymp; {formattedBalance} {balanceCurrency}
                    </HiddenPlaceholder>
                ) : (
                    stringBalance &&
                    fiatAmount &&
                    symbol && (
                        <BaseCurrencyValue
                            amount={stringBalance}
                            symbol={symbol}
                            tokenAddress={tokenAddress}
                            rateType="current"
                            showApproximationIndicator
                        />
                    )
                )}
            </Text>
        );
    }

    return (
        <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
            <Translation id="TR_BALANCE" />
            {': '}
            <HiddenPlaceholder>
                {formattedBalance} {balanceCurrency}
            </HiddenPlaceholder>
            {stringBalance && fiatAmount && symbol && stringBalance !== '0' && (
                <>
                    <>&nbsp;≈&nbsp;</>
                    <BaseCurrencyValue
                        amount={stringBalance}
                        symbol={symbol}
                        tokenAddress={tokenAddress}
                        rateType="current"
                    />
                </>
            )}
        </Text>
    );
};
