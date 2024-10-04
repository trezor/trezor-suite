import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import styled from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { FONT_SIZE, SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketCryptoAmountProps } from 'src/types/coinmarket/coinmarketOffers';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';

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

export const CoinmarketUtilsPrice = ({
    amountInCrypto,
    sendAmount,
    sendCurrency,
    receiveAmount,
    receiveCurrency,
}: CoinmarketCryptoAmountProps) => {
    const { type } = useCoinmarketOffersContext();

    return (
        <PriceWrap>
            <PriceTitle>
                <Translation
                    id={
                        coinmarketGetAmountLabels({
                            type,
                            amountInCrypto: !!amountInCrypto,
                        }).labelComparatorOffer
                    }
                />
            </PriceTitle>
            <PriceValueWrap>
                <PriceValue>
                    {amountInCrypto ? (
                        <CoinmarketFiatAmount amount={sendAmount} currency={sendCurrency} />
                    ) : (
                        <>
                            {receiveCurrency && (
                                <CoinmarketCryptoAmount
                                    amount={receiveAmount}
                                    cryptoId={receiveCurrency}
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
