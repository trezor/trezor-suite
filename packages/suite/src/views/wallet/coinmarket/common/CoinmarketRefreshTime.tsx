import { ReactElement } from 'react';
import styled from 'styled-components';
import { variables, Spinner, ProgressPie } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    justify-self: flex-end;
    flex: 1;
    align-items: center;
    justify-content: center;
    font-size: ${variables.FONT_SIZE.SMALL};
    gap: ${spacingsPx.sm};
`;

const TimerText = styled.div`
    display: flex;
`;

const RefreshLabel = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const RefreshTime = styled.div`
    margin-left: ${spacingsPx.xxs};
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

interface CoinmarketRefreshTimeProps {
    isLoading: boolean;
    seconds: number;
    refetchInterval: number;
    label: ReactElement;
}

export const CoinmarketRefreshTime = ({
    isLoading,
    seconds,
    refetchInterval,
    label,
}: CoinmarketRefreshTimeProps) => {
    const remaining = refetchInterval - seconds;
    const progress = (remaining / refetchInterval) * 100;

    return (
        <>
            {isLoading ? (
                <Spinner size={15} />
            ) : (
                <Wrapper>
                    <ProgressPie valueInPercents={progress} />
                    <TimerText>
                        <RefreshLabel>{label}</RefreshLabel>
                        <RefreshTime>{`0:${remaining < 10 ? '0' : ''}${remaining}`}</RefreshTime>
                    </TimerText>
                </Wrapper>
            )}
        </>
    );
};
