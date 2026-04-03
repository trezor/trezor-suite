import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import {
    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
    selectTradingQuotesTimer,
} from '@suite-common/trading';
import { H2 } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacingsPx } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getCryptoQuoteAmountProps,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingRefreshTime } from 'src/views/wallet/trading/common';
import { TradingHeaderFilter } from 'src/views/wallet/trading/common/TradingHeader/TradingHeaderFilter';
import { TradingHeaderSummary } from 'src/views/wallet/trading/common/TradingHeader/TradingHeaderSummary';

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

const TradingHeaderTimer = ({ titleTimer }: Pick<TradingHeaderProps, 'titleTimer'>) => {
    const quotesTimer = useSelector(selectTradingQuotesTimer);
    const [now, setNow] = useState(0);

    useEffect(() => {
        if (quotesTimer.status !== 'running') {
            return;
        }

        setNow(Date.now());

        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [quotesTimer.status]);

    const isLoading = quotesTimer.status === 'loading';
    const seconds =
        quotesTimer.status === 'running'
            ? Math.max(0, Math.floor((now - quotesTimer.fetchedAt) / 1000))
            : 0;

    return (
        <TradingRefreshTime
            isLoading={isLoading}
            refetchInterval={INVITY_API_RELOAD_QUOTES_AFTER_SECONDS}
            seconds={seconds}
            label={<Translation id={titleTimer} />}
        />
    );
};

export const TradingHeader = ({ title, titleTimer }: TradingHeaderProps) => {
    const context = useTradingFormContext();
    const { quotes } = context;
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
                    <TradingHeaderTimer titleTimer={titleTimer} />
                </HeaderTradingRefreshTime>
            </HeaderBottom>
        </Header>
    );
};
