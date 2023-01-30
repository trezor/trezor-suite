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

import { SESSION_PHASE_MESSAGES } from '@suite-constants/coinjoin';
import { getPhaseTimerFormat, getSessionDeadlineFormat } from '@wallet-utils/coinjoinUtils';
import {
    pauseCoinjoinSession,
    restoreCoinjoinSession,
    stopCoinjoinSession,
} from '@wallet-actions/coinjoinAccountActions';
import { useSelector, useActions, useDevice } from '@suite-hooks';
import {
    selectCoinjoinAccountByKey,
    selectSessionProgressByAccountKey,
} from '@wallet-reducers/coinjoinReducer';
import { useBlockedCoinjoinResume } from '@suite/hooks/coinjoin/useBlockedCoinjoinResume';
import { useCoinjoinSessionPhase } from '@wallet-hooks';

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

const ProgressWheel = styled.div<{
    progress: number;
    isPaused: boolean;
    isResumeBlocked: boolean;
    isToggleDisabled: boolean;
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

    ${({ theme, isResumeBlocked }) =>
        isResumeBlocked &&
        css`
            ${ProgressContent} {
                background: ${theme.BG_LIGHT_RED};

                path {
                    fill: ${theme.BG_RED};
                }
            }
        `}

    ${({ isResumeBlocked, isToggleDisabled }) =>
        !isResumeBlocked &&
        !isToggleDisabled &&
        css`
            cursor: pointer;

            :hover {
                ${ProgressContent} {
                    background: ${({ theme }) => theme.BG_GREY};
                }
            }

            :active {
                ${ProgressContent} {
                    background: ${({ theme }) => lighten(0.02, theme.BG_GREY)};
                }
            }
        `}
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

const CrossIcon = styled(Icon)`
    width: 10px;
    height: 10px;
`;

const TextCointainer = styled.div`
    height: 30px;
`;

interface CoinjoinStatusProps {
    session: CoinjoinSession;
    accountKey: string;
}

export const CoinjoinStatus = ({ session, accountKey }: CoinjoinStatusProps) => {
    const [isWheelHovered, setIsWheelHovered] = useState(false);
    const sessionProgress = useSelector(state =>
        selectSessionProgressByAccountKey(state, accountKey),
    );
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, accountKey));

    const { isCoinjoinResumeBlocked, coinjoinResumeBlockedMessageId, featureMessageContent } =
        useBlockedCoinjoinResume();

    const actions = useActions({
        stopCoinjoinSession,
        pauseCoinjoinSession,
        restoreCoinjoinSession,
    });

    const { isLocked } = useDevice();

    const sessionPhase = useCoinjoinSessionPhase(accountKey);
    const menuRef = useRef<HTMLUListElement & { close: () => void }>(null);
    const theme = useTheme();

    const { paused, roundPhase, roundPhaseDeadline, sessionDeadline } = session;
    const isPaused = !!paused;
    const isLoading = coinjoinAccount?.session?.starting;
    const isToggleDisabled = isLoading || isLocked();

    const togglePause = useCallback(() => {
        if (isCoinjoinResumeBlocked || isToggleDisabled) return;
        if (isPaused) {
            actions.restoreCoinjoinSession(accountKey);
        } else {
            actions.pauseCoinjoinSession(accountKey);
        }
    }, [isCoinjoinResumeBlocked, isPaused, isToggleDisabled, actions, accountKey]);

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
                        isHidden: !isPaused || isLoading || isCoinjoinResumeBlocked,
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
        [isCoinjoinResumeBlocked, isPaused, togglePause, isLoading, actions, accountKey],
    );

    const iconConfig = {
        size: 18,
        color: theme.TYPE_DARK_GREY,
    };

    const getProgressContent = () => {
        if (isPaused && isWheelHovered && !isCoinjoinResumeBlocked) {
            return (
                <>
                    <PlayIcon icon="PLAY" {...iconConfig} />
                    <Translation id="TR_RESUME" />
                </>
            );
        }

        if (isPaused || isCoinjoinResumeBlocked || isWheelHovered) {
            return (
                <>
                    <PauseIcon icon="PAUSE" {...iconConfig} />
                    <Translation
                        id={isPaused || isCoinjoinResumeBlocked ? 'TR_PAUSED' : 'TR_PAUSE'}
                    />
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
        if (isLoading) {
            return <Translation id="TR_RESUMING" />;
        }

        if (isPaused) {
            return <Translation id="TR_COINJOIN_PAUSED" />;
        }

        if (sessionPhase !== undefined) {
            return (
                <>
                    <Translation id={SESSION_PHASE_MESSAGES[sessionPhase]} />

                    {roundPhase !== undefined && roundPhaseDeadline && (
                        <p>
                            <CountdownTimer
                                isApproximate
                                deadline={roundPhaseDeadline}
                                format={getPhaseTimerFormat(roundPhaseDeadline)}
                            />
                        </p>
                    )}
                </>
            );
        }

        return <Translation id="TR_LOOKING_FOR_COINJOIN_ROUND" />;
    };

    const tooltipMessage =
        featureMessageContent ||
        (coinjoinResumeBlockedMessageId && <Translation id={coinjoinResumeBlockedMessageId} />);

    return (
        <Container>
            <SessionControlsMenu alignMenu="right" items={menuItems} ref={menuRef} />

            <Tooltip content={isCoinjoinResumeBlocked && tooltipMessage} hideOnClick={false}>
                <ProgressWheel
                    progress={sessionProgress}
                    isPaused={isPaused}
                    isToggleDisabled={isLoading || isToggleDisabled}
                    isResumeBlocked={isCoinjoinResumeBlocked}
                    onClick={togglePause}
                    onMouseEnter={() => setIsWheelHovered(true)}
                    onMouseLeave={() => setIsWheelHovered(false)}
                >
                    <ProgressContent>
                        {isLoading ? (
                            <StyledLoader size={30} strokeWidth={3} />
                        ) : (
                            getProgressContent()
                        )}
                    </ProgressContent>
                </ProgressWheel>
            </Tooltip>
            <TextCointainer>{getProgressMessage()}</TextCointainer>
        </Container>
    );
};
