import React from 'react';
import styled, { css } from 'styled-components';
import { FluidSpinner, Icon, useTheme, variables } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    selectCurrentCoinjoinWheelStates,
    selectCurrentSessionDeadlineInfo,
    selectRoundsDurationInHours,
} from 'src/reducers/wallet/coinjoinReducer';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { FormattedNumber } from 'react-intl';

export const Container = styled.div<{ isWide: boolean }>`
    width: ${({ isWide }) => `calc(100% - ${isWide ? 12 : 8}px)`};
    height: ${({ isWide }) => `calc(100% - ${isWide ? 12 : 8}px)`};
    background: ${({ theme }) => theme.BG_WHITE};
    border-radius: 50%;
    transition: background 0.15s ease-out, width 0.15s ease-out, height 0.15s ease-out;
`;

const CenteringContainer = styled.div`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 80px;
    height: 80px;
    left: calc(50% - 40px);
    top: calc(50% - 40px);
`;

const AllPrivateContent = styled.div`
    padding-top: 2px;
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const ProgressPercentage = styled.p`
    font-size: ${variables.FONT_SIZE.H2};
    line-height: 1;
`;

const StyledLoader = styled(FluidSpinner)`
    opacity: 0.4;
`;

const TimeLeft = styled.p`
    max-width: 80%;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.H2};
    line-height: 1;
`;

const iconBase = css`
    margin-bottom: 4px;
`;

const PlayIcon = styled(Icon)`
    ${iconBase}
    margin-left: 4px;
`;

const StyledIcon = styled(Icon)`
    ${iconBase};
`;

interface ProgressContentProps {
    accountKey: string;
    isWheelHovered: boolean;
}

export const ProgressContent = ({ accountKey, isWheelHovered }: ProgressContentProps) => {
    const { isSessionActive, isLoading, isPaused, isAllPrivate, isAccountEmpty } = useSelector(
        selectCurrentCoinjoinWheelStates,
    );
    const { sessionDeadline } = useSelector(selectCurrentSessionDeadlineInfo);
    const roundsDurationInHours = useSelector(selectRoundsDurationInHours);

    const theme = useTheme();
    const { coinjoinSessionBlocker, isCoinjoinSessionBlocked } =
        useCoinjoinSessionBlockers(accountKey);

    const getProgressContent = () => {
        const iconConfig = {
            size: 25,
            color: theme.TYPE_DARK_GREY,
        };

        const isLoadingIndicatorShown =
            isLoading || (isSessionActive && !sessionDeadline && !isCoinjoinSessionBlocked);
        const isRunningAndHovered = isSessionActive && isWheelHovered;
        const isRunningAndBlocked = isSessionActive && isCoinjoinSessionBlocked && isPaused;

        if (isAccountEmpty || coinjoinSessionBlocker === 'ANONYMITY_ERROR') {
            return <PlayIcon icon="PLAY" {...iconConfig} />;
        }

        if (isLoadingIndicatorShown) {
            return <StyledLoader size={40} strokeWidth={2} />;
        }

        if (isAllPrivate && !isSessionActive) {
            return (
                <AllPrivateContent>
                    <ProgressPercentage>
                        <FormattedNumber value={1} style="percent" />
                    </ProgressPercentage>
                    <Translation id="TR_PRIVATE" />
                </AllPrivateContent>
            );
        }

        if (isRunningAndBlocked) {
            return (
                <>
                    <StyledIcon icon="PAUSE" {...iconConfig} />
                    <Translation id="TR_PAUSED" />
                </>
            );
        }

        if (isRunningAndHovered) {
            return (
                <>
                    <StyledIcon icon="STOP" {...iconConfig} />
                    <Translation id="TR_STOP" />
                </>
            );
        }

        if (isSessionActive && sessionDeadline) {
            return (
                <>
                    <TimeLeft>
                        <CountdownTimer
                            deadline={sessionDeadline}
                            minUnit="hour"
                            unitDisplay="narrow"
                            minUnitValue={roundsDurationInHours}
                        />
                    </TimeLeft>
                    <p>
                        <Translation id="TR_LEFT" />
                    </p>
                </>
            );
        }

        return (
            <>
                <PlayIcon icon="PLAY" {...iconConfig} color={theme.TYPE_GREEN} />
                <Translation id="TR_START" />
            </>
        );
    };

    return (
        <Container isWide={isSessionActive || isLoading}>
            <CenteringContainer>{getProgressContent()}</CenteringContainer>
        </Container>
    );
};
