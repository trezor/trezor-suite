import { H2, Icon, variables } from '@trezor/components';
import styled from 'styled-components';
import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketCryptoAmountProps } from 'src/types/coinmarket/coinmarketOffers';
import {
    isCoinmarketBuyOffers,
    isCoinmarketSellOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';

const SummaryWrap = styled.div`
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

const TextWrap = styled(H2)`
    ${SCREEN_QUERY.BELOW_TABLET} {
        font-size: ${variables.FONT_SIZE.H2};
    }
`;

const CoinmarketHeaderSummary = ({
    className,
    fiatAmount,
    fiatCurrency,
    cryptoCurrency,
    cryptoAmount,
}: CoinmarketCryptoAmountProps) => {
    const context = useCoinmarketOffersContext();

    return (
        <SummaryWrap className={className}>
            <SummaryRow>
                {isCoinmarketBuyOffers(context) && (
                    <>
                        <TextWrap>
                            <CoinmarketFiatAmount
                                amount={fiatAmount ?? ''}
                                currency={fiatCurrency}
                            />
                        </TextWrap>
                        <StyledIcon icon="ARROW_RIGHT_LONG" />
                        {cryptoCurrency && (
                            <TextWrap>
                                <CoinmarketCryptoAmount
                                    symbol={cryptoToCoinSymbol(cryptoCurrency)}
                                    displayLogo
                                />
                            </TextWrap>
                        )}
                    </>
                )}

                {isCoinmarketSellOffers(context) && (
                    <>
                        {cryptoCurrency && (
                            <TextWrap>
                                <CoinmarketCryptoAmount
                                    amount={cryptoAmount ?? ''}
                                    symbol={cryptoToCoinSymbol(cryptoCurrency)}
                                    displayLogo
                                />
                            </TextWrap>
                        )}
                        <StyledIcon icon="ARROW_RIGHT_LONG" />
                        <TextWrap>
                            <CoinmarketFiatAmount currency={fiatCurrency} />
                        </TextWrap>
                    </>
                )}
            </SummaryRow>
        </SummaryWrap>
    );
};

export default CoinmarketHeaderSummary;
