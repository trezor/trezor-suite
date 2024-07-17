import { spacingsPx } from '@trezor/theme';
import { useSelector } from 'react-redux';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import styled from 'styled-components';
import { NETWORKS } from 'src/config/wallet';
import { localizeNumber, networkAmountToSatoshi } from '@suite-common/wallet-utils';
import { NetworkSymbol } from 'src/types/wallet';
import CoinmarketCoinImage from '../CoinmarketCoinImage';
import {
    CoinmarketAmountContainer,
    CoinmarketAmountWrapper,
    CoinmarketAmountWrapperText,
} from 'src/views/wallet/coinmarket';

const TokenWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TokenLogoBig = styled(CoinmarketCoinImage)`
    height: 32px;
    margin: 0 ${spacingsPx.xxs} 0 0;
`;

export interface CoinmarketCryptoAmountProps {
    amount: string | number;
    symbol: string;
}

const CoinmarketFormOfferCryptoAmount = ({ amount, symbol }: CoinmarketCryptoAmountProps) => {
    const { areSatsDisplayed } = useBitcoinAmountUnit();
    const locale = useSelector(selectLanguage);

    const lowerCaseSymbol = symbol?.toLowerCase();
    const { features: networkFeatures, testnet: isTestnet } =
        NETWORKS.find(network => network.symbol === lowerCaseSymbol) ?? {};
    const areSatsSupported = !!networkFeatures?.includes('amount-unit');
    const isSatoshis = areSatsSupported && areSatsDisplayed;

    let formattedValue = amount;
    let formattedSymbol = symbol?.toUpperCase();

    // convert to satoshis if needed
    if (isSatoshis) {
        formattedValue = networkAmountToSatoshi(String(amount), lowerCaseSymbol as NetworkSymbol);
        formattedSymbol = isTestnet ? `sat ${symbol?.toUpperCase()}` : 'sat';
    }

    formattedValue = formattedValue ? localizeNumber(formattedValue, locale) : '';

    return (
        <CoinmarketAmountContainer>
            <CoinmarketAmountWrapper>
                <CoinmarketAmountWrapperText title={formattedValue}>
                    {formattedValue}
                </CoinmarketAmountWrapperText>
                <TokenWrapper>
                    <TokenLogoBig symbol={symbol} />
                    {formattedSymbol}
                </TokenWrapper>
            </CoinmarketAmountWrapper>
        </CoinmarketAmountContainer>
    );
};

export default CoinmarketFormOfferCryptoAmount;
