import React, { useCallback, useState } from 'react';
import styled, { css, DefaultTheme } from 'styled-components';
import { animations, Tooltip } from '@trezor/components';
import { ProgressContent, Container as ProgressContentContainer } from './ProgressContent';
import { lighten, rgba } from 'polished';
import { useSelector } from '@suite-hooks/useSelector';
import {
    selectCurrentCoinjoinWheelStates,
    selectSessionProgressByAccountKey,
} from '@wallet-reducers/coinjoinReducer';
import { useDispatch } from '@suite-hooks/useDispatch';
import { useCoinjoinSessionBlockers } from '@suite/hooks/coinjoin/useCoinjoinSessionBlockers';
import { goto } from '@suite-actions/routerActions';
import { Translation } from '@suite-components/Translation';
import { openModal } from '@suite-actions/modalActions';

const getOutlineSvg = (theme: DefaultTheme) =>
    `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='100' ry='100' stroke='${theme.TYPE_LIGHT_GREY.replace(
        '#',
        '%23',
    )}' stroke-width='5' stroke-dasharray='7' stroke-dashoffset='35' stroke-linecap='butt'/%3e%3c/svg%3e")`;

const ProgressIndicator = styled.div`
    position: absolute;
    top: 11px;
    width: 94px;
    height: 94px;
    background: conic-gradient(#fff0 20deg, #ccc);
    border-radius: 50%;
    font-size: 15px;
    animation: ${animations.DELAYED_SPIN} 2.3s cubic-bezier(0.34, 0.45, 0.17, 0.87) infinite;
`;

const Wheel = styled.div<{
    progress: number;
    isPaused: boolean;
    isHoverDisabled: boolean;
    hasCriticalError: boolean;
    hasDottedOutline: boolean;
    isWithoutProgressOutline: boolean;
    isStartable: boolean;
    isGreyedOut: boolean;
}>`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 94px;
    height: 94px;
    border-radius: 50%;
    background: ${({ theme, progress }) =>
        `conic-gradient(${theme.BG_GREEN} ${3.6 * progress}deg, ${rgba(
            theme.STROKE_GREY,
            0.6,
        )} 0)`};
    transition: background 0.1s, opacity 0.05s;
    user-select: none;

    ${({ isHoverDisabled }) =>
        !isHoverDisabled &&
        css`
            cursor: pointer;

            :active {
                ${ProgressContentContainer} {
                    background: ${({ theme }) => lighten(0.02, theme.BG_GREY)};
                }
            }
        `}

    ${({ isWithoutProgressOutline }) =>
        isWithoutProgressOutline &&
        css`
            background: none;
            color: ${({ theme }) => theme.TYPE_GREEN};

            ${ProgressContentContainer} {
                background: ${({ theme }) => theme.BG_LIGHT_GREEN};

                path {
                    fill: ${({ theme }) => theme.TYPE_GREEN};
                }
            }
        `}
        
    ${({ hasDottedOutline }) =>
        hasDottedOutline &&
        css`
            opacity: 0.3;
            background: ${({ theme }) => getOutlineSvg(theme)};
            cursor: not-allowed;
        `}      

    ${({ isStartable, isPaused, hasCriticalError, theme }) =>
        (isStartable || isPaused) &&
        !hasCriticalError &&
        css`
            :hover {
                ${ProgressContentContainer} {
                    width: calc(100% - 12px);
                    height: calc(100% - 12px);

                    span {
                        color: ${theme.TYPE_GREEN};
                    }
                }
            }
        `}

    ${({ isPaused, hasCriticalError, theme, progress }) =>
        isPaused &&
        css`
            background: ${`conic-gradient(${theme.TYPE_LIGHTER_GREY} ${3.6 * progress}deg, ${rgba(
                theme.STROKE_GREY,
                0.6,
            )} 0)`};

            :hover {
                path {
                    fill: ${!hasCriticalError && theme.TYPE_GREEN};
                }
            }
        `}

    ${({ isGreyedOut, theme }) =>
        isGreyedOut &&
        css`
            filter: grayscale(1);
            color: inherit;

            ${ProgressContentContainer} {
                background: ${theme.BG_GREY};
            }
        `}
`;

interface ProgressWheelProps {
    accountKey: string;
    togglePause: () => void;
}

export const ProgressWheel = ({ accountKey, togglePause }: ProgressWheelProps) => {
    const {
        isSessionActive,
        isPaused,
        isLoading,
        isAllPrivate,
        isAccountEmpty,
        isResumeBlockedByLastingIssue,
        isNonePrivate,
        isCoinjoinUneco,
    } = useSelector(selectCurrentCoinjoinWheelStates);
    const sessionProgress = useSelector(state =>
        selectSessionProgressByAccountKey(state, accountKey),
    );

    const [isWheelHovered, setIsWheelHovered] = useState(false);

    const dispatch = useDispatch();
    const { isCoinjoinSessionBlocked, coinjoinSessionBlocker, coinjoinSessionBlockedMessage } =
        useCoinjoinSessionBlockers(accountKey);

    const handleWheelClick = useCallback(() => {
        if (isCoinjoinSessionBlocked || isAllPrivate || isAccountEmpty) {
            return;
        }

        if (isSessionActive) {
            togglePause();

            return;
        }

        if (isCoinjoinUneco) {
            dispatch(openModal({ type: 'uneco-coinjoin-warning' }));

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
        isCoinjoinUneco,
    ]);

    const getTooltipMessage = () => {
        if (isAllPrivate) {
            return;
        }

        if (isAccountEmpty) {
            return <Translation id="TR_NOTHING_TO_ANONYMIZE" />;
        }

        if (coinjoinSessionBlockedMessage) {
            return coinjoinSessionBlockedMessage;
        }
    };

    const isProgressIndicatorShown =
        isSessionActive && !isPaused && !isLoading && !isResumeBlockedByLastingIssue;
    const isHoverDisabled = isCoinjoinSessionBlocked || isAllPrivate;
    const isSessionStartable = !isSessionActive && !isAllPrivate && !isCoinjoinSessionBlocked;
    const hasCriticalError = isResumeBlockedByLastingIssue && !isAccountEmpty && !isAllPrivate;
    const isWithoutProgressOutline = isNonePrivate && !isSessionActive && !isAccountEmpty;
    const hasDottedOutline = isAccountEmpty || coinjoinSessionBlocker === 'ANONYMITY_ERROR';

    return (
        <Tooltip content={getTooltipMessage()} hideOnClick={false}>
            <>
                {isProgressIndicatorShown && <ProgressIndicator />}

                <Wheel
                    progress={sessionProgress}
                    isPaused={isPaused}
                    isHoverDisabled={isHoverDisabled}
                    hasCriticalError={hasCriticalError}
                    isGreyedOut={hasCriticalError}
                    hasDottedOutline={hasDottedOutline}
                    isWithoutProgressOutline={isWithoutProgressOutline}
                    isStartable={isSessionStartable}
                    onClick={handleWheelClick}
                    onMouseEnter={() => setIsWheelHovered(true)}
                    onMouseLeave={() => setIsWheelHovered(false)}
                >
                    <ProgressContent accountKey={accountKey} isWheelHovered={isWheelHovered} />
                </Wheel>
            </>
        </Tooltip>
    );
};
