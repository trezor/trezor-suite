import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { amountToSatoshi } from '@suite-common/wallet-utils';
import { typography } from '@trezor/theme';
import { FiatValue, HiddenPlaceholder, Translation } from 'src/components/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    coinmarketGetAccountLabel,
    getNetworkDecimals,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import styled from 'styled-components';

const CoinmarketBalanceWrapper = styled.div`
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
`;

interface CoinmarketBalanceProps {
    balance: string | undefined;
    cryptoSymbolLabel: string | undefined;
    networkSymbol: NetworkSymbol;
    tokenAddress?: TokenAddress | undefined;
    showOnlyAmount?: boolean;
    amountInCrypto?: boolean;
}

export const CoinmarketBalance = ({
    balance, // expects a value in full units (BTC not sats)
    cryptoSymbolLabel,
    networkSymbol,
    tokenAddress,
    showOnlyAmount,
    amountInCrypto,
}: CoinmarketBalanceProps) => {
    const { shouldSendInSats } = useBitcoinAmountUnit(networkSymbol);
    const balanceCurrency = coinmarketGetAccountLabel(cryptoSymbolLabel ?? '', shouldSendInSats);
    const networkDecimals = getNetworkDecimals(networks[networkSymbol].decimals);
    const stringBalance = !isNaN(Number(balance)) ? balance : '0';
    const formattedBalance =
        stringBalance && shouldSendInSats
            ? amountToSatoshi(stringBalance, networkDecimals)
            : stringBalance;

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: stringBalance || '',
        symbol: networkSymbol || '',
    });

    if (showOnlyAmount) {
        if (!balance ?? isNaN(Number(balance))) return null;

        return (
            <CoinmarketBalanceWrapper>
                &asymp;{' '}
                {!amountInCrypto ? (
                    <HiddenPlaceholder>
                        {formattedBalance} {cryptoSymbolLabel}
                    </HiddenPlaceholder>
                ) : (
                    stringBalance &&
                    fiatAmount &&
                    networkSymbol &&
                    stringBalance !== '0' && (
                        <FiatValue
                            amount={stringBalance}
                            symbol={networkSymbol}
                            tokenAddress={tokenAddress}
                        />
                    )
                )}
            </CoinmarketBalanceWrapper>
        );
    }

    return (
        <CoinmarketBalanceWrapper>
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
        </CoinmarketBalanceWrapper>
    );
};
