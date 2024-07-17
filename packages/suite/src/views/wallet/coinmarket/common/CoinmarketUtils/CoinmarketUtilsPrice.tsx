import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import styled from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { FONT_SIZE, SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketCryptoAmountProps } from 'src/types/coinmarket/coinmarketOffers';

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

const CoinmarketUtilsPrice = ({
    wantCrypto,
    sendAmount,
    sendCurrency,
    receiveAmount,
    receiveCurrency,
}: CoinmarketCryptoAmountProps) => {
    return (
        <PriceWrap>
            <PriceTitle>
                <Translation
                    id={wantCrypto ? 'TR_COINMARKET_YOU_WILL_PAY' : 'TR_COINMARKET_YOU_WILL_GET'}
                />
            </PriceTitle>
            <PriceValueWrap>
                <PriceValue>
                    {wantCrypto ? (
                        <CoinmarketFiatAmount amount={sendAmount} currency={sendCurrency} />
                    ) : (
                        <>
                            {receiveCurrency && (
                                <CoinmarketCryptoAmount
                                    amount={receiveAmount}
                                    symbol={cryptoToCoinSymbol(receiveCurrency)}
                                    displayLogo
                                />
                            )}
                        </>
                    )}
                </PriceValue>
                {/*<CoinmarketUtilsTooltip quote={quote} />*/}
            </PriceValueWrap>
        </PriceWrap>
    );
};

export default CoinmarketUtilsPrice;
