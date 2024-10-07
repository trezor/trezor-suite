import styled from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { FONT_SIZE, SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketCryptoAmountProps } from 'src/types/coinmarket/coinmarket';

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
    const { type } = useCoinmarketFormContext();

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
