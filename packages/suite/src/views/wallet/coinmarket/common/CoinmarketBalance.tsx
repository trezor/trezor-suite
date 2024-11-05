import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

import { FiatValue, HiddenPlaceholder, Translation } from 'src/components/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { CoinmarketAccountOptionsGroupOptionProps } from 'src/types/coinmarket/coinmarket';
import {
    coinmarketGetAccountLabel,
    getCoinmarketNetworkDecimals,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';

interface CoinmarketBalanceProps {
    balance: string | undefined;
    cryptoSymbolLabel: string | undefined;
    networkSymbol: NetworkSymbol;
    tokenAddress?: TokenAddress | undefined;
    showOnlyAmount?: boolean;
    amountInCrypto?: boolean;
    sendCryptoSelect?: CoinmarketAccountOptionsGroupOptionProps;
}

export const CoinmarketBalance = ({
    balance, // expects a value in full units (BTC not sats)
    cryptoSymbolLabel,
    networkSymbol,
    tokenAddress,
    showOnlyAmount,
    amountInCrypto,
    sendCryptoSelect,
}: CoinmarketBalanceProps) => {
    const { shouldSendInSats } = useBitcoinAmountUnit(networkSymbol);
    const balanceCurrency = coinmarketGetAccountLabel(cryptoSymbolLabel ?? '', shouldSendInSats);
    const networkDecimals = getCoinmarketNetworkDecimals({
        sendCryptoSelect,
        network: networks[networkSymbol],
    });
    const stringBalance = !isNaN(Number(balance)) ? balance : '0';
    const formattedBalance =
        stringBalance && shouldSendInSats
            ? amountToSmallestUnit(stringBalance, networkDecimals)
            : stringBalance;

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: stringBalance || '',
        symbol: networkSymbol || '',
    });

    if (showOnlyAmount) {
        if (Number(balance) === 0 || isNaN(Number(balance))) return null;

        return (
            <Text variant="tertiary" typographyStyle="label">
                &asymp;{' '}
                {!amountInCrypto ? (
                    <HiddenPlaceholder>
                        {formattedBalance} {cryptoSymbolLabel}
                    </HiddenPlaceholder>
                ) : (
                    stringBalance &&
                    fiatAmount &&
                    networkSymbol && (
                        <FiatValue
                            amount={stringBalance}
                            symbol={networkSymbol}
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
            {stringBalance && fiatAmount && networkSymbol && stringBalance !== '0' && (
                <>
                    {' '}
                    (
                    <FiatValue
                        amount={stringBalance}
                        symbol={networkSymbol}
                        tokenAddress={tokenAddress}
                    />
                    )
                </>
            )}
        </Text>
    );
};
