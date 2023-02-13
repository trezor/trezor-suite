import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
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
    animations,
} from '@trezor/components';
import { CoinjoinSession } from '@wallet-types/coinjoin';
import { Translation } from '@suite-components/Translation';
import { CountdownTimer } from '@suite-components';
import { SESSION_PHASE_MESSAGES } from '@suite-constants/coinjoin';
import {
    pauseCoinjoinSession,
    restoreCoinjoinSession,
    stopCoinjoinSession,
} from '@wallet-actions/coinjoinAccountActions';
import { useSelector } from '@suite-hooks';
import {
    selectRoundsDurationInHours,
    selectSessionProgressByAccountKey,
    selectCurrentCoinjoinBalanceBreakdown,
} from '@wallet-reducers/coinjoinReducer';
import { useCoinjoinSessionBlockers } from '@suite/hooks/coinjoin/useCoinjoinSessionBlockers';
import { useCoinjoinSessionPhase } from '@wallet-hooks';
import { selectSelectedAccountBalance } from '@wallet-reducers/selectedAccountReducer';
import { goto } from '@suite-actions/routerActions';

const Container = styled.div`
    position: relative;
    width: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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

const ProgressIndicator = styled.div`
    width: 94px;
    height: 94px;
    position: absolute;
    background: conic-gradient(#ffffff00 20deg, #cccccc);
    border-radius: 50%;
    font-size: 15px;
    animation: ${animations.DELAYED_SPIN} 2.3s cubic-bezier(0.34, 0.45, 0.17, 0.87) infinite;
`;

const ProgressContent = styled.div<{ isWide: boolean }>`
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

const ProgressWheel = styled.div<{
    progress: number;
    isPaused: boolean;
    isHoverDisabled: boolean;
    hasCriticalError: boolean;
    isAccountEmpty: boolean;
    isWithoutProgressOutline: boolean;
    isStartable: boolean;
}>`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 94px;
    height: 94px;
    border-radius: 50%;
    background: ${({ theme, progress, isPaused }) =>
        `conic-gradient(${isPaused ? theme.TYPE_ORANGE : theme.BG_GREEN} ${3.6 * progress}deg, ${
            theme.STROKE_GREY
        }a1 0)`};
    transition: background 0.1s, opacity 0.05s;
    user-select: none;

    ${({ isHoverDisabled }) =>
        !isHoverDisabled &&
        css`
            cursor: pointer;

            :active {
                ${ProgressContent} {
                    background: ${({ theme }) => lighten(0.02, theme.BG_GREY)};
                }
            }
        `}

    ${({ theme, hasCriticalError }) =>
        hasCriticalError &&
        css`
            ${ProgressContent} {
                background: ${theme.BG_LIGHT_RED};

                path {
                    fill: ${theme.BG_RED};
                }
            }
        `}

    

        ${({ isAccountEmpty }) =>
        isAccountEmpty &&
        css`
            opacity: 0.3;
            background-image: ${({ theme }) =>
                `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='100' ry='100' stroke='${theme.TYPE_LIGHT_GREY.replace(
                    '#',
                    '%23',
                )}' stroke-width='5' stroke-dasharray='7' stroke-dashoffset='35' stroke-linecap='butt'/%3e%3c/svg%3e")`};
            cursor: not-allowed;
        `}

        ${({ isWithoutProgressOutline }) =>
        isWithoutProgressOutline &&
        css`
            background: none;
            color: ${({ theme }) => theme.TYPE_GREEN};

            ${ProgressContent} {
                background: ${({ theme }) => theme.BG_LIGHT_GREEN};

                path {
                    fill: ${({ theme }) => theme.TYPE_GREEN};
                }
            }
        `}

        ${({ isStartable, isPaused }) =>
        (isStartable || isPaused) &&
        css`
            :hover {
                ${ProgressContent} {
                    width: calc(100% - 12px);
                    height: calc(100% - 12px);

                    span {
                        color: ${({ theme }) => theme.TYPE_GREEN};
                    }

                    path {
                        fill: ${({ theme }) => theme.TYPE_LIGHT_GREY};
                    }
                }
            }
        `}
`;

const AllPrivateContent = styled.div`
    padding-top: 2px;
    color: ${({ theme }) => theme.TYPE_GREEN};

    p {
        font-size: ${variables.FONT_SIZE.H2};
        line-height: 1;
    }
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

const PauseIcon = styled(Icon)`
    ${iconBase};
`;

const CrossIcon = styled(Icon)`
    width: 10px;
    height: 10px;
`;

const TextCointainer = styled.div`
    height: 30px;
    margin-top: 4px;
    font-size: ${variables.FONT_SIZE.TINY};
`;

interface CoinjoinStatusWheelProps {
    accountKey: string;
    session?: CoinjoinSession;
}

export const CoinjoinStatusWheel = ({ accountKey, session }: CoinjoinStatusWheelProps) => {
    const { anonymized, notAnonymized } = useSelector(selectCurrentCoinjoinBalanceBreakdown);
    const balance = useSelector(selectSelectedAccountBalance);
    const roundsDurationInHours = useSelector(selectRoundsDurationInHours);
    const sessionProgress = useSelector(state =>
        selectSessionProgressByAccountKey(state, accountKey),
    );

    const [isWheelHovered, setIsWheelHovered] = useState(false);

    const { coinjoinSessionBlocker, coinjoinSessionBlockedMessage, isCoinjoinSessionBlocked } =
        useCoinjoinSessionBlockers(accountKey);
    const sessionPhase = useCoinjoinSessionPhase(accountKey);

    const menuRef = useRef<HTMLUListElement & { close: () => void }>(null);
    const theme = useTheme();
    const dispatch = useDispatch();

    const { paused, roundPhase, roundPhaseDeadline, sessionDeadline } = session || {};

    const isAccountEmpty = !balance || balance === '0';
    const isNonePrivate = anonymized === '0';
    const isAllPrivate = notAnonymized === '0';

    const isSessionActive = !!session;
    const isPaused = !!paused;
    const isLoading = coinjoinSessionBlocker === 'SESSION_STARTING';
    const isResumeBlockedByLastingIssue =
        !!coinjoinSessionBlocker &&
        !['DEVICE_LOCKED', 'SESSION_STARTING'].includes(coinjoinSessionBlocker);

    const togglePause = useCallback(() => {
        if (isCoinjoinSessionBlocked) {
            return;
        }

        if (isPaused) {
            dispatch(restoreCoinjoinSession(accountKey));
        } else {
            dispatch(pauseCoinjoinSession(accountKey));
        }
    }, [isCoinjoinSessionBlocked, isPaused, dispatch, accountKey]);

    const handleWheelClick = useCallback(() => {
        if (isCoinjoinSessionBlocked || isAllPrivate || isAccountEmpty) {
            return;
        }

        if (isSessionActive) {
            togglePause();

            return;
        }

        dispatch(goto('wallet-anonymize', { preserveParams: true }));
    }, [
        isCoinjoinSessionBlocked,
        isAllPrivate,
        isAccountEmpty,
        isSessionActive,
        togglePause,
        dispatch,
    ]);

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
                        isHidden: !isPaused || isLoading || isCoinjoinSessionBlocked,
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
                            dispatch(stopCoinjoinSession(accountKey));
                        },
                        'data-test': `@coinjoin/cancel`,
                    },
                ],
            },
        ],
        [accountKey, dispatch, isCoinjoinSessionBlocked, isLoading, isPaused, togglePause],
    );

    const getProgressContent = () => {
        const iconConfig = {
            size: 25,
            color: theme.TYPE_DARK_GREY,
        };

        const isLoadingIndicatorShown =
            isLoading || (isSessionActive && !sessionDeadline && !isPaused);
        const isPausedAndHovered = isPaused && isWheelHovered && !isCoinjoinSessionBlocked;
        const isPausedOrRunningAndHovered = isPaused || (isSessionActive && isWheelHovered);

        if (isAccountEmpty) {
            return <PlayIcon icon="PLAY" {...iconConfig} />;
        }

        if (isLoadingIndicatorShown) {
            return <StyledLoader size={40} strokeWidth={2} />;
        }

        if (isAllPrivate && !isSessionActive) {
            return (
                <AllPrivateContent>
                    <p>100%</p>
                    <Translation id="TR_PRIVATE" />
                </AllPrivateContent>
            );
        }

        if (isPausedAndHovered) {
            return (
                <>
                    <PlayIcon icon="PLAY" {...iconConfig} />
                    <Translation id="TR_RESUME" />
                </>
            );
        }

        if (isPausedOrRunningAndHovered) {
            return (
                <>
                    <PauseIcon icon="PAUSE" {...iconConfig} />
                    <Translation id={isPaused ? 'TR_PAUSED' : 'TR_PAUSE'} />
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
                                pastDeadlineMessage="TR_TIMER_PAST_DEADLINE"
                            />
                        </p>
                    )}
                </>
            );
        }

        return <Translation id="TR_LOOKING_FOR_COINJOIN_ROUND" />;
    };

    const isProgressIndicatorShown = isSessionActive && !isPaused && !isLoading;
    const isHoverDisabled = isCoinjoinSessionBlocked || isAllPrivate;
    const isSessionStartable = !isSessionActive && !isAllPrivate && !isCoinjoinSessionBlocked;
    const hasCriticalError = isResumeBlockedByLastingIssue && !isAccountEmpty;
    const isWithoutProgressOutline = isNonePrivate && !isSessionActive && !isAccountEmpty;

    return (
        <Container>
            <SessionControlsMenu alignMenu="right" items={menuItems} ref={menuRef} />

            <Tooltip content={!isAccountEmpty && coinjoinSessionBlockedMessage} hideOnClick={false}>
                <>
                    {isProgressIndicatorShown && <ProgressIndicator />}

                    <ProgressWheel
                        progress={sessionProgress}
                        isPaused={isPaused}
                        isHoverDisabled={isHoverDisabled}
                        hasCriticalError={hasCriticalError}
                        isAccountEmpty={isAccountEmpty}
                        isWithoutProgressOutline={isWithoutProgressOutline}
                        isStartable={isSessionStartable}
                        onClick={handleWheelClick}
                        onMouseEnter={() => setIsWheelHovered(true)}
                        onMouseLeave={() => setIsWheelHovered(false)}
                    >
                        <ProgressContent isWide={isSessionActive && !isPaused}>
                            <CenteringContainer>{getProgressContent()}</CenteringContainer>
                        </ProgressContent>
                    </ProgressWheel>
                </>
            </Tooltip>

            {isSessionActive && <TextCointainer>{getProgressMessage()}</TextCointainer>}
        </Container>
    );
};
