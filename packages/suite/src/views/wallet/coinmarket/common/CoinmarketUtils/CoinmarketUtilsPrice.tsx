import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketOffersItemProps } from '../CoinmarketOffers/CoinmarketOffersItem';
import styled from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { FONT_SIZE, SCREEN_QUERY } from '@trezor/components/src/config/variables';

const PriceWrap = styled.div``;

const PriceTitle = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const PriceValueWrap = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
`;

const PriceValue = styled.div`
    ${typography.titleSmall}
    color: ${({ theme }) => theme.textDefault};
    margin-top: ${spacingsPx.xxs};
    margin-right: ${spacingsPx.sm};

    ${SCREEN_QUERY.MOBILE} {
        font-size: ${FONT_SIZE.BIG};
    }
`;

const CoinmarketUtilsPrice = ({ quote, wantCrypto }: CoinmarketOffersItemProps) => {
    return (
        <PriceWrap>
            <PriceTitle>
                <Translation id="TR_COINMARKET_YOU_GET" />
            </PriceTitle>
            <PriceValueWrap>
                <PriceValue>
                    {wantCrypto ? (
                        <CoinmarketFiatAmount
                            amount={quote.fiatStringAmount}
                            currency={quote.fiatCurrency}
                        />
                    ) : (
                        <CoinmarketCryptoAmount
                            amount={quote.receiveStringAmount}
                            symbol={cryptoToCoinSymbol(quote.receiveCurrency!)}
                        />
                    )}
                </PriceValue>
                {/*<CoinmarketUtilsTooltip quote={quote} />*/}
            </PriceValueWrap>
        </PriceWrap>
    );
};

export default CoinmarketUtilsPrice;
