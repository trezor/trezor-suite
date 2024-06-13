import { spacingsPx } from '@trezor/theme';
import { useSelector } from 'react-redux';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import styled from 'styled-components';
import { NETWORKS } from 'src/config/wallet';
import { localizeNumber, networkAmountToSatoshi } from '@suite-common/wallet-utils';
import { NetworkSymbol } from 'src/types/wallet';
import invityAPI from 'src/services/suite/invityAPI';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
`;

const TokenWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TokenLogoBig = styled.img`
    height: 32px;
    margin: 0 ${spacingsPx.xxs} 0 0;
`;

const FormattedCryptoAmountWrapper = styled.div`
    padding-right: ${spacingsPx.xs};
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export interface CoinmarketCryptoAmountProps {
    amount: string | number;
    symbol: string;
}

const CoinmarketFormOfferCryptoAmount = ({ amount, symbol }: CoinmarketCryptoAmountProps) => {
    const logoSrc = symbol ? invityAPI.getCoinLogoUrl(symbol) : null;
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
        <Wrapper>
            <FormattedCryptoAmountWrapper title={formattedValue}>
                {formattedValue}
            </FormattedCryptoAmountWrapper>
            <TokenWrapper>
                {logoSrc && <TokenLogoBig src={logoSrc} alt="" />}
                {formattedSymbol}
            </TokenWrapper>
        </Wrapper>
    );
};

export default CoinmarketFormOfferCryptoAmount;
