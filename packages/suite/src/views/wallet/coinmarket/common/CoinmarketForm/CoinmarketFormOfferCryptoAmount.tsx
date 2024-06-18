import { nativeTypography, spacingsPx } from '@trezor/theme';
import { useSelector } from 'react-redux';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import styled from 'styled-components';
import { NETWORKS } from 'src/config/wallet';
import { localizeNumber, networkAmountToSatoshi } from '@suite-common/wallet-utils';
import { NetworkSymbol } from 'src/types/wallet';
import { H2 } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import CoinmarketCoinImage from '../CoinmarketCoinImage';

const Wrapper = styled(H2)`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-top: ${spacingsPx.md};

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        font-size: 28px;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        font-size: ${nativeTypography.titleMedium.fontSize}px;
    }

    ${SCREEN_QUERY.MOBILE} {
        font-size: ${nativeTypography.titleSmall.fontSize}px;
        margin-top: ${spacingsPx.xs};
    }
`;

const TokenWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TokenLogoBig = styled(CoinmarketCoinImage)`
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
                <TokenLogoBig symbol={symbol} />
                {formattedSymbol}
            </TokenWrapper>
        </Wrapper>
    );
};

export default CoinmarketFormOfferCryptoAmount;
