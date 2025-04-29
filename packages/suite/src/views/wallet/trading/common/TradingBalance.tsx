import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

import { FiatValue, HiddenPlaceholder, Translation } from 'src/components/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { TradingAccountOptionsGroupOptionProps } from 'src/types/trading/trading';
import {
    getTradingNetworkDecimals,
    tradingGetAccountLabel,
} from 'src/utils/wallet/trading/tradingUtils';

interface TradingBalanceProps {
    balance: string | undefined;
    symbol: NetworkSymbol;
    displaySymbol: string | undefined;
    tokenAddress?: TokenAddress | undefined;
    showOnlyAmount?: boolean;
    amountInCrypto?: boolean;
    sendCryptoSelect?: TradingAccountOptionsGroupOptionProps;
}

export const TradingBalance = ({
    balance, // expects a value in full units (BTC not sats)
    symbol,
    displaySymbol,
    tokenAddress,
    showOnlyAmount,
    amountInCrypto,
    sendCryptoSelect,
}: TradingBalanceProps) => {
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const balanceCurrency = tradingGetAccountLabel(displaySymbol ?? '', shouldSendInSats);
    const networkDecimals = getTradingNetworkDecimals({
        sendCryptoSelect,
        network: getNetwork(symbol),
    });
    const stringBalance = !isNaN(Number(balance)) ? balance : '0';
    const formattedBalance =
        stringBalance && shouldSendInSats
            ? amountToSmallestUnit(stringBalance, networkDecimals)
            : stringBalance;

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: stringBalance || '',
        symbol,
        tokenAddress,
    });

    if (showOnlyAmount) {
        if (Number(balance) === 0 || isNaN(Number(balance))) return null;

        return (
            <Text variant="tertiary" typographyStyle="label">
                &asymp;{' '}
                {!amountInCrypto ? (
                    <HiddenPlaceholder>
                        {formattedBalance} {balanceCurrency}
                    </HiddenPlaceholder>
                ) : (
                    stringBalance &&
                    fiatAmount &&
                    symbol && (
                        <FiatValue
                            amount={stringBalance}
                            symbol={symbol}
                            tokenAddress={tokenAddress}
                        />
                    )
                )}
            </Text>
        );
    }

    return (
        <Text variant="tertiary" typographyStyle="label">
            <Translation id="TR_BALANCE" />
            {': '}
            <HiddenPlaceholder>
                {formattedBalance} {balanceCurrency}
            </HiddenPlaceholder>
            {stringBalance && fiatAmount && symbol && stringBalance !== '0' && (
                <>
                    {' '}
                    (
                    <FiatValue amount={stringBalance} symbol={symbol} tokenAddress={tokenAddress} />
                    )
                </>
            )}
        </Text>
    );
};
