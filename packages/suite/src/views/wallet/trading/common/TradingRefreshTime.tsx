import { type ReactElement } from 'react';

import styled from 'styled-components';

import { Paragraph, ProgressPie, Spinner } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

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
    color: ${({ theme }) => theme.textSubdued};
    ${typography['body-sm-strong']}
`;

interface TradingRefreshTimeProps {
    isLoading: boolean;
    seconds: number;
    refetchInterval: number;
    label: ReactElement;
}

export const TradingRefreshTime = ({
    isLoading,
    seconds,
    refetchInterval,
    label,
}: TradingRefreshTimeProps) => {
    const remaining = refetchInterval - seconds;
    const progress = (remaining / refetchInterval) * 100;

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
                        <RefreshTime>{`0:${remaining < 10 ? '0' : ''}${remaining}`}</RefreshTime>
                    </TimerText>
                </Wrapper>
            )}
        </>
    );
};
