import { H2, Icon, variables } from '@trezor/components';
import styled from 'styled-components';
import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import invityAPI from 'src/services/suite/invityAPI';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
`;

const OrigAmount = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const StyledIcon = styled(Icon)`
    padding: 0 10px;
    margin: 0 20px;
`;

const TokenLogo = styled.img`
    display: flex;
    align-items: center;
    height: 21px;
`;

const Send = styled(H2)`
    padding-top: 3px;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const Receive = styled(H2)`
    padding-top: 3px;
    padding-left: 10px;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const CoinmarketHeaderSummary = () => {
    const { quotesRequest, quotes } = useCoinmarketBuyOffersContext();

    if (!quotesRequest || !quotes || quotes.length === 0) return null;
    const { fiatStringAmount, fiatCurrency, wantCrypto } = quotesRequest;

    return (
        <>
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
        </>
    );
};

export default CoinmarketHeaderSummary;
