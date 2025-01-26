import styled from 'styled-components';

import { H2 } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';

import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS } from 'src/constants/wallet/trading/metadata';
import {
    getCryptoQuoteAmountProps,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingHeaderSummary } from 'src/views/wallet/trading/common/TradingHeader/TradingHeaderSummary';
import { TradingRefreshTime } from 'src/views/wallet/trading/common';
import { TradingHeaderFilter } from 'src/views/wallet/trading/common/TradingHeader/TradingHeaderFilter';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

const Header = styled.div`
    padding-top: ${spacingsPx.sm};
    padding-bottom: ${spacingsPx.xs};
`;

const HeaderTop = styled.div`
    margin-bottom: ${spacingsPx.xl};
`;

const HeaderBottom = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-top: ${spacingsPx.xl};

    ${SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const HeaderTradingRefreshTime = styled.div`
    margin-left: auto;
    padding: ${spacingsPx.xxs} 0 ${spacingsPx.xxs} ${spacingsPx.lg};

    ${SCREEN_QUERY.MOBILE} {
        order: -2;
        margin-left: 0;
        padding: ${spacingsPx.xxs} 0;
    }
`;

const TradingHeaderSummaryWrap = styled(TradingHeaderSummary)`
    ${SCREEN_QUERY.BELOW_TABLET} {
        order: -1;
    }
`;

interface TradingHeaderProps {
    title: ExtendedMessageDescriptor['id'];
    titleTimer: ExtendedMessageDescriptor['id'];
}

export const TradingHeader = ({ title, titleTimer }: TradingHeaderProps) => {
    const context = useTradingFormContext();
    const { timer, quotes } = context;
    const headerProps = getCryptoQuoteAmountProps(quotes?.[0], context);

    return (
        <Header>
            <HeaderTop>
                <H2>
                    <Translation id={title} />
                </H2>
            </HeaderTop>
            {headerProps && isTradingExchangeContext(context) && (
                <TradingHeaderSummaryWrap {...headerProps} />
            )}
            <HeaderBottom>
                <TradingHeaderFilter />
                <HeaderTradingRefreshTime>
                    <TradingRefreshTime
                        isLoading={timer.isLoading}
                        refetchInterval={INVITY_API_RELOAD_QUOTES_AFTER_SECONDS}
                        seconds={timer.timeSpend.seconds}
                        label={<Translation id={titleTimer} />}
                    />
                </HeaderTradingRefreshTime>
            </HeaderBottom>
        </Header>
    );
};
