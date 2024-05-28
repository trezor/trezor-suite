import { H2, Icon, variables } from '@trezor/components';
import styled from 'styled-components';
import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import invityAPI from 'src/services/suite/invityAPI';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketBuyOffers';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';

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

const OrigAmount = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const StyledIcon = styled(Icon)`
    padding: 0 ${spacingsPx.sm};
    margin: 0 ${spacingsPx.lg};
`;

const TokenLogo = styled.img`
    display: flex;
    align-items: center;
    height: 21px;
`;

const Send = styled(H2)`
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    ${SCREEN_QUERY.BELOW_TABLET} {
        font-size: ${variables.FONT_SIZE.H2};
    }
`;

const Receive = styled(Send)`
    padding-left: 10px;
`;

interface CoinmarketHeaderSummaryProps {
    className?: string;
}

const CoinmarketHeaderSummary = ({ className }: CoinmarketHeaderSummaryProps) => {
    const { quotesRequest, quotes } = useCoinmarketBuyOffersContext();

    if (!quotesRequest || !quotes || quotes.length === 0) return null;
    const { fiatStringAmount, fiatCurrency, wantCrypto } = quotesRequest;

    return (
        <SummaryWrap className={className}>
            <SummaryRow>
                <Send>
                    <CoinmarketFiatAmount
                        amount={!wantCrypto ? quotes[0].fiatStringAmount : ''}
                        currency={quotes[0].fiatCurrency}
                    />
                </Send>
                <StyledIcon icon="ARROW_RIGHT_LONG" />
                <TokenLogo
                    src={invityAPI.getCoinLogoUrl(cryptoToCoinSymbol(quotes[0].receiveCurrency!))}
                />
                <Receive>
                    <CoinmarketCryptoAmount
                        amount={wantCrypto ? quotes[0].receiveStringAmount : ''}
                        symbol={cryptoToCoinSymbol(quotes[0].receiveCurrency!)}
                    />
                </Receive>
            </SummaryRow>
            {!wantCrypto && (
                <OrigAmount>
                    ≈ <CoinmarketFiatAmount amount={fiatStringAmount} currency={fiatCurrency} />
                </OrigAmount>
            )}
        </SummaryWrap>
    );
};

export default CoinmarketHeaderSummary;
