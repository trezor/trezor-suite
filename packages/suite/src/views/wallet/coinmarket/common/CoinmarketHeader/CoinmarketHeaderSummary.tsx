import { H3, Icon, Row } from '@trezor/components';
import styled from 'styled-components';
import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketCryptoAmountProps } from 'src/types/coinmarket/coinmarketOffers';
import {
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketExchangeHeaderSummary } from './CoinmarketExchangeHeaderSummary';
import { spacingsPx } from '@trezor/theme';

const IconWrapper = styled.div`
    margin-left: ${spacingsPx.sm};
    margin-right: ${spacingsPx.sm};
`;

const SummaryWrap = styled.div`
    ${SCREEN_QUERY.BELOW_TABLET} {
        padding-left: 0;
        margin-top: 0;
    }
`;

export const CoinmarketHeaderSummary = ({
    className,
    sendAmount,
    sendCurrency,
    receiveCurrency,
    receiveAmount,
}: CoinmarketCryptoAmountProps) => {
    const context = useCoinmarketOffersContext();

    return (
        <SummaryWrap className={className}>
            <Row alignItems="center">
                {isCoinmarketSellOffers(context) && (
                    <>
                        {receiveCurrency && (
                            <H3>
                                <CoinmarketCryptoAmount
                                    amount={receiveAmount}
                                    cryptoId={receiveCurrency}
                                    displayLogo
                                />
                            </H3>
                        )}
                        <IconWrapper>
                            <Icon variant="tertiary" name="arrowRightLong" />
                        </IconWrapper>
                        <H3>
                            <CoinmarketFiatAmount currency={sendCurrency} />
                        </H3>
                    </>
                )}

                {isCoinmarketExchangeOffers(context) && (
                    <CoinmarketExchangeHeaderSummary
                        sendCurrency={sendCurrency}
                        sendAmount={sendAmount}
                        receiveCurrency={receiveCurrency}
                    />
                )}
            </Row>
        </SummaryWrap>
    );
};
