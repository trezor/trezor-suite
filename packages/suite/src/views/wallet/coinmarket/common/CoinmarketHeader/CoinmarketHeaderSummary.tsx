import { H2, Icon, variables } from '@trezor/components';
import styled from 'styled-components';
import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketCryptoAmountProps } from 'src/types/coinmarket/coinmarketOffers';

const SummaryWrap = styled.div`
    margin-top: -3px;
    padding-left: 10px;

    ${SCREEN_QUERY.BELOW_TABLET} {
        padding-left: 0;
        margin-top: 0;
    }
`;

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    padding: 0 ${spacingsPx.sm};
    margin: 0 ${spacingsPx.lg};
`;

const Send = styled(H2)`
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    ${SCREEN_QUERY.BELOW_TABLET} {
        font-size: ${variables.FONT_SIZE.H2};
    }
`;

const CoinmarketHeaderSummary = ({
    className,
    wantCrypto,
    fiatAmount,
    fiatCurrency,
    cryptoAmount,
    cryptoCurrency,
}: CoinmarketCryptoAmountProps) => {
    // TODO: control for sell

    return (
        <SummaryWrap className={className}>
            <SummaryRow>
                <Send>
                    <CoinmarketFiatAmount
                        amount={!wantCrypto ? fiatAmount : ''}
                        currency={fiatCurrency}
                    />
                </Send>
                <StyledIcon icon="ARROW_RIGHT_LONG" />
                <CoinmarketCryptoAmount
                    amount={wantCrypto ? cryptoAmount : ''}
                    symbol={cryptoToCoinSymbol(cryptoCurrency!)}
                    displaySymbol
                />
            </SummaryRow>
        </SummaryWrap>
    );
};

export default CoinmarketHeaderSummary;
