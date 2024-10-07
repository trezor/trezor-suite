import { H3, Icon, Row } from '@trezor/components';
import styled from 'styled-components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacingsPx } from '@trezor/theme';
import { CoinmarketExchangeHeaderSummary } from 'src/views/wallet/coinmarket/common/CoinmarketHeader/CoinmarketExchangeHeaderSummary';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    isCoinmarketExchangeContext,
    isCoinmarketSellContext,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { CoinmarketCryptoAmountProps } from 'src/types/coinmarket/coinmarket';

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
    const context = useCoinmarketFormContext();

    return (
        <SummaryWrap className={className}>
            <Row alignItems="center">
                {isCoinmarketSellContext(context) && (
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

                {isCoinmarketExchangeContext(context) && (
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
