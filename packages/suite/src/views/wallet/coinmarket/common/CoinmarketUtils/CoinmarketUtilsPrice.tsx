import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketOffersItemProps } from '../CoinmarketOffers/CoinmarketOffersItem';
import styled from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { Translation } from 'src/components/suite';

const PriceWrap = styled.div``;

const PriceTitle = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const PriceValueWrap = styled.div`
    display: flex;
    align-items: flex-end;
`;

const PriceValue = styled.div`
    ${typography.titleSmall}
    color: ${({ theme }) => theme.textDefault};
    margin-top: ${spacingsPx.xxs};
`;

const PriceTooltip = styled.div`
    margin-left: ${spacingsPx.sm};
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
                <PriceTooltip>{/*<CoinmarketUtilsPrice quote={quote} wantCrypto />*/}</PriceTooltip>
            </PriceValueWrap>
        </PriceWrap>
    );
};

export default CoinmarketUtilsPrice;
