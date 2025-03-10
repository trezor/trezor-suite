import styled from 'styled-components';

import { H3, Icon, Row } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacingsPx } from '@trezor/theme';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingCryptoAmountProps } from 'src/types/trading/trading';
import {
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { TradingFiatAmount } from 'src/views/wallet/trading/common/TradingFiatAmount';
import { TradingExchangeHeaderSummary } from 'src/views/wallet/trading/common/TradingHeader/TradingExchangeHeaderSummary';

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

export const TradingHeaderSummary = ({
    className,
    sendAmount,
    sendCurrency,
    receiveCurrency,
    receiveAmount,
}: TradingCryptoAmountProps) => {
    const context = useTradingFormContext();

    return (
        <SummaryWrap className={className}>
            <Row alignItems="center">
                {isTradingSellContext(context) && (
                    <>
                        {receiveCurrency && (
                            <H3>
                                <TradingCryptoAmount
                                    type={context.type}
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
                            <TradingFiatAmount currency={sendCurrency} />
                        </H3>
                    </>
                )}

                {isTradingExchangeContext(context) && (
                    <TradingExchangeHeaderSummary
                        sendCurrency={sendCurrency}
                        sendAmount={sendAmount}
                        receiveCurrency={receiveCurrency}
                    />
                )}
            </Row>
        </SummaryWrap>
    );
};
