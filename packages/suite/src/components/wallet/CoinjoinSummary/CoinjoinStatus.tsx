import React, { useMemo, useRef, useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { lighten } from 'polished';
import {
    Dropdown,
    FluidSpinner,
    GroupedMenuItems,
    Icon,
    useTheme,
    variables,
    Tooltip,
} from '@trezor/components';
import { CoinjoinSession } from '@wallet-types/coinjoin';
import { Translation } from '@suite-components/Translation';
import { CountdownTimer } from '@suite-components';

import { COINJOIN_PHASE_MESSAGES } from '@suite-constants/coinjoin';
import { getPhaseTimerFormat, getSessionDeadlineFormat } from '@wallet-utils/coinjoinUtils';
import {
    pauseCoinjoinSession,
    restoreCoinjoinSession,
    stopCoinjoinSession,
} from '@wallet-actions/coinjoinAccountActions';
import { useSelector, useActions } from '@suite-hooks';
import { selectSessionProgressByAccountKey } from '@wallet-reducers/coinjoinReducer';
import {
    Feature,
    selectIsFeatureDisabled,
    selectFeatureMessageContent,
} from '@suite-reducers/messageSystemReducer';
import { useBlockedCoinjoinResume } from '@suite/hooks/coinjoin/useBlockedCoinjoinResume';

const Container = styled.div`
    position: relative;
    width: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
`;

const SessionControlsMenu = styled(Dropdown)`
    position: absolute;
    bottom: calc(100% - 14px);
    right: -8px;
`;

const MenuLabel = styled.div`
    display: flex;
    align-items: center;

    > :first-child {
        margin-right: 12px;
    }
`;

const ProgressWheel = styled.div<{
    progress: number;
    isPaused: boolean;
    isResumeDisable: boolean;
    isLoading: boolean;
}>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    margin-bottom: 10px;
    border-radius: 50%;
    background: ${({ theme, progress, isPaused }) =>
        `conic-gradient(${isPaused ? theme.TYPE_ORANGE : theme.BG_GREEN} ${3.6 * progress}deg, ${
            theme.STROKE_GREY
        } 0)`};
    transition: background 0.1s, opacity 0.05s;
    user-select: none;
    ${({ isResumeDisable }) =>
        !isResumeDisable &&
        css`
            cursor: pointer;
        `}

    ${({ isLoading }) =>
        !isLoading &&
        css`
            :hover {
                > :first-child {
                    background: ${({ theme }) => theme.BG_GREY};
                }
            }

            :active {
                > :first-child {
                    background: ${({ theme }) => lighten(0.02, theme.BG_GREY)};
                }
            }
        `}
`;

const ProgressContent = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: calc(100% - 12px);
    height: calc(100% - 12px);
    background: ${({ theme }) => theme.BG_WHITE};
    border-radius: 50%;
    transition: background 0.1s;
`;

const StyledLoader = styled(FluidSpinner)`
    opacity: 0.7;
`;

const TimeLeft = styled.p`
    max-width: 80%;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    line-height: 1;
`;

const iconBase = css`
    margin-bottom: 4px;
`;

const PlayIcon = styled(Icon)`
    ${iconBase}
    margin-left: 4px;
`;

const PauseIcon = styled(Icon)`
    ${iconBase};
`;

const PausedInTooltipIcon = styled(PauseIcon)`
    margin-left: 12px;
`;

const CrossIcon = styled(Icon)`
    width: 10px;
    height: 10px;
`;

const TextCointainer = styled.p`
    height: 30px;
`;

interface CoinjoinStatusProps {
    session: CoinjoinSession;
    accountKey: string;
}

export const CoinjoinStatus = ({ session, accountKey }: CoinjoinStatusProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isWheelHovered, setIsWheelHovered] = useState(false);
    const sessionProgress = useSelector(state =>
        selectSessionProgressByAccountKey(state, accountKey),
    );
    const isCoinJoinDisabledByFeatureFlag = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.coinjoin),
    );
    const featureMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.coinjoin),
    );

    const { isCoinjoinResumeBlocked, coinjoinResumeBlockedMessageId } = useBlockedCoinjoinResume();

    const isCoinjoinBlocked = isCoinjoinResumeBlocked || isCoinJoinDisabledByFeatureFlag;

    const menuRef = useRef<HTMLUListElement & { close: () => void }>(null);
    const theme = useTheme();
    const actions = useActions({
        stopCoinjoinSession,
        pauseCoinjoinSession,
        restoreCoinjoinSession,
    });

    const { paused, phaseDeadline, sessionDeadline, phase } = session;

    const isPaused = !!paused;

    const togglePause = useCallback(async () => {
        if (isCoinjoinBlocked) return;
        if (isPaused) {
            setIsLoading(true);
            await actions.restoreCoinjoinSession(accountKey);
            setIsLoading(false);
        } else {
            actions.pauseCoinjoinSession(accountKey);
        }
    }, [isCoinjoinBlocked, isPaused, actions, accountKey]);

    const menuItems = useMemo<Array<GroupedMenuItems>>(
        () => [
            {
                key: 'coinjoin-actions',
                options: [
                    {
                        key: 'resume',
                        label: (
                            <MenuLabel>
                                <Icon icon="PLAY" size={10} />
                                <Translation id="TR_RESUME" />
                            </MenuLabel>
                        ),
                        callback: togglePause,
                        'data-test': `@coinjoin/resume`,
                        isHidden: !isPaused || isLoading || isCoinjoinBlocked,
                    },
                    {
                        key: 'resuming',
                        label: (
                            <MenuLabel>
                                <FluidSpinner size={10} />
                                <Translation id="TR_RESUMING" />
                            </MenuLabel>
                        ),
                        isHidden: !isLoading,
                        isDisabled: true,
                    },
                    {
                        key: 'pause',
                        label: (
                            <MenuLabel>
                                <Icon icon="PAUSE" size={10} />
                                <Translation id="TR_PAUSE" />
                            </MenuLabel>
                        ),
                        callback: togglePause,
                        'data-test': `@coinjoin/pause`,
                        isHidden: isPaused,
                    },
                    {
                        key: 'cancel',
                        label: (
                            <MenuLabel>
                                <CrossIcon icon="CROSS" size={14} />
                                <Translation id="TR_CANCEL" />
                            </MenuLabel>
                        ),
                        callback: () => {
                            menuRef.current?.close();
                            actions.stopCoinjoinSession(accountKey);
                        },
                        'data-test': `@coinjoin/cancel`,
                    },
                ],
            },
        ],
        [isCoinjoinBlocked, isPaused, togglePause, isLoading, actions, accountKey],
    );

    const iconConfig = {
        size: 18,
        color: theme.TYPE_DARK_GREY,
    };

    const getProgressContent = () => {
        if (isCoinJoinDisabledByFeatureFlag) {
            return (
                <Tooltip content={featureMessageContent}>
                    <>
                        <PausedInTooltipIcon icon="PAUSE" {...iconConfig} />
                        <Translation id="TR_PAUSED" />
                    </>
                </Tooltip>
            );
        }
        if (isCoinjoinResumeBlocked) {
            return (
                <Tooltip content={<Translation id={coinjoinResumeBlockedMessageId} />}>
                    <>
                        <PausedInTooltipIcon icon="PAUSE" {...iconConfig} />
                        <Translation id="TR_PAUSED" />
                    </>
                </Tooltip>
            );
        }

        if (isPaused) {
            if (isWheelHovered) {
                return (
                    <>
                        <PlayIcon icon="PLAY" {...iconConfig} />
                        <Translation id="TR_RESUME" />
                    </>
                );
            }

            return (
                <>
                    <PauseIcon icon="PAUSE" {...iconConfig} />
                    <Translation id="TR_PAUSED" />
                </>
            );
        }

        if (isWheelHovered) {
            return (
                <>
                    <PauseIcon icon="PAUSE" {...iconConfig} />
                    <Translation id="TR_PAUSE" />
                </>
            );
        }

        if (sessionDeadline) {
            return (
                <>
                    <TimeLeft>
                        <CountdownTimer
                            deadline={sessionDeadline}
                            format={getSessionDeadlineFormat(sessionDeadline)}
                        />
                    </TimeLeft>
                    <p>
                        <Translation id="TR_LEFT" />
                    </p>
                </>
            );
        }

        return <StyledLoader size={30} strokeWidth={3} />;
    };

    const getProgressMessage = () => {
        if (isPaused) {
            return (
                <TextCointainer>
                    <Translation id="TR_COINJOIN_PAUSED" />
                </TextCointainer>
            );
        }

        if (phase !== undefined) {
            return (
                <>
                    <Translation id={COINJOIN_PHASE_MESSAGES[phase]} />
                    <p>
                        <CountdownTimer
                            isApproximate
                            deadline={phaseDeadline}
                            format={getPhaseTimerFormat(phaseDeadline)}
                        />
                    </p>
                </>
            );
        }

        return (
            <TextCointainer>
                <Translation id="TR_LOOKING_FOR_COINJOIN_ROUND" />
            </TextCointainer>
        );
    };

    return (
        <Container>
            <SessionControlsMenu alignMenu="right" items={menuItems} ref={menuRef} />
            <ProgressWheel
                progress={sessionProgress}
                isPaused={isPaused}
                isLoading={isLoading}
                isResumeDisable={isCoinjoinBlocked}
                onClick={togglePause}
                onMouseEnter={() => setIsWheelHovered(true)}
                onMouseLeave={() => setIsWheelHovered(false)}
            >
                <ProgressContent>
                    {isLoading ? <StyledLoader size={30} strokeWidth={3} /> : getProgressContent()}
                </ProgressContent>
            </ProgressWheel>

            {isLoading ? (
                <TextCointainer>
                    {isPaused ? <Translation id="TR_RESUMING" /> : <Translation id="TR_PAUSING" />}
                </TextCointainer>
            ) : (
                getProgressMessage()
            )}
        </Container>
    );
};
