import { FormattedNumber } from 'react-intl';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { Icon, Spinner, Tooltip } from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    selectCurrentCoinjoinWheelStates,
    selectCurrentSessionDeadlineInfo,
    selectRoundsDurationInHours,
} from 'src/reducers/wallet/coinjoinReducer';

export const Container = styled.div<{ $isWide: boolean }>`
    width: ${({ $isWide }) => `calc(100% - ${$isWide ? 12 : 8}px)`};
    height: ${({ $isWide }) => `calc(100% - ${$isWide ? 12 : 8}px)`};
    background: ${({ theme }) => theme.legacyBackgroundNeutralBoldInverted};
    border-radius: 50%;
    transition:
        background 0.15s ease-out,
        width 0.15s ease-out,
        height 0.15s ease-out;
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
    padding-top: ${spacingsPx.xxxs};
    color: ${({ theme }) => theme.contentBrand};
`;

const ProgressPercentage = styled.p`
    ${typography['headline-md']}
`;

const TooltipChildren = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const TimeLeft = styled.p`
    max-width: 80%;
    color: ${({ theme }) => theme.contentPrimary};
    ${typography['body-md-strong']}
`;

interface CoinjoinProgressContentProps {
    accountKey: AccountKey;
    isWheelHovered: boolean;
}

export const CoinjoinProgressContent = ({
    accountKey,
    isWheelHovered,
}: CoinjoinProgressContentProps) => {
    const {
        isSessionActive,
        isLoading,
        isPaused,
        isAutoStopEnabled,
        isCriticalPhase,
        isAllPrivate,
        isAccountEmpty,
    } = useSelector(selectCurrentCoinjoinWheelStates);
    const { sessionDeadline } = useSelector(selectCurrentSessionDeadlineInfo);
    const roundsDurationInHours = useSelector(selectRoundsDurationInHours);

    const { coinjoinSessionBlocker, isCoinjoinSessionBlocked } =
        useCoinjoinSessionBlockers(accountKey);

    const getProgressContent = () => {
        const iconConfig = {
            size: 25,
            color: 'contentPrimary' as const,
        };

        const isLoadingIndicatorShown =
            isLoading ||
            (isSessionActive && !sessionDeadline && !isCoinjoinSessionBlocked && !isWheelHovered);
        const isRunningAndHovered = isSessionActive && isWheelHovered;
        const isRunningAndBlocked = isSessionActive && isCoinjoinSessionBlocked && isPaused;

        if (isAccountEmpty || coinjoinSessionBlocker === 'ANONYMITY_ERROR') {
            return (
                <Icon
                    name="play"
                    margin={{ bottom: spacings.xxs, left: spacings.xxs }}
                    {...iconConfig}
                />
            );
        }

        if (isLoadingIndicatorShown) {
            return <Spinner size={40} opacity={0.4} />;
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
                    <Icon name="pause" margin={{ bottom: spacings.xxs }} {...iconConfig} />
                    <Translation id="TR_PAUSED" />
                </>
            );
        }

        if (isAutoStopEnabled) {
            if (isWheelHovered) {
                return (
                    <>
                        <Icon name="play" margin={{ bottom: spacings.xxs }} {...iconConfig} />
                        <Translation id="TR_RESUME" />
                    </>
                );
            }

            return (
                <>
                    <Icon name="stop" margin={{ bottom: spacings.xxs }} {...iconConfig} />
                    <Translation id="TR_STOPPING" />
                </>
            );
        }

        if (isRunningAndHovered) {
            if (isCriticalPhase) {
                return (
                    <Tooltip
                        maxWidth={160}
                        offset={40}
                        cursor="pointer"
                        content={<Translation id="TR_AUTO_STOP_TOOLTIP" />}
                    >
                        <TooltipChildren>
                            <Icon name="stop" margin={{ bottom: spacings.xxs }} {...iconConfig} />
                            <Translation id="TR_STOP" />
                        </TooltipChildren>
                    </Tooltip>
                );
            }

            return (
                <>
                    <Icon name="stop" margin={{ bottom: spacings.xxs }} {...iconConfig} />
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
                <Icon
                    name="play"
                    margin={{ bottom: spacings.xxs }}
                    {...iconConfig}
                    color="contentBrand"
                />
                <Translation id="TR_START" />
            </>
        );
    };

    return (
        <Container $isWide={isSessionActive || isLoading}>
            <CenteringContainer>{getProgressContent()}</CenteringContainer>
        </Container>
    );
};
