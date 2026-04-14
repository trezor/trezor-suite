import { type ReactElement } from 'react';

import styled from 'styled-components';

import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS, clamp } from '@suite-common/trading';
import { Paragraph, ProgressPie, Spinner } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

import { useTradingRefetchCountdown } from 'src/hooks/wallet/trading/useTradingRefetchCountdown';

const Wrapper = styled.div`
    display: flex;
    justify-self: flex-end;
    align-items: center;
    justify-content: center;
    ${typography['body-sm']}
    gap: ${spacingsPx.sm};
    flex: none;
`;

const ProgressPieWrap = styled.div`
    flex: none;
`;

const TimerText = styled.div`
    display: flex;
`;

const RefreshTime = styled.div`
    margin-left: ${spacingsPx.xxs};
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm-strong']}
`;

interface TradingRefreshTimeProps {
    isLoading: boolean;
    label: ReactElement;
}

export const TradingRefreshTime = ({ isLoading, label }: TradingRefreshTimeProps) => {
    const remaining = useTradingRefetchCountdown();
    const progress = clamp((remaining / INVITY_API_RELOAD_QUOTES_AFTER_SECONDS) * 100, 0, 100);

    return (
        <>
            {isLoading ? (
                <Spinner size={16} isDisabled={true} />
            ) : (
                <Wrapper data-testid="@trading/refresh-time">
                    <ProgressPieWrap data-testid="@trading/refresh-time-pie">
                        <ProgressPie valueInPercents={progress} />
                    </ProgressPieWrap>
                    <TimerText data-testid="@trading/refresh-time-text">
                        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {label}
                        </Paragraph>
                        <RefreshTime>{`0:${String(remaining).padStart(2, '0')}`}</RefreshTime>
                    </TimerText>
                </Wrapper>
            )}
        </>
    );
};
