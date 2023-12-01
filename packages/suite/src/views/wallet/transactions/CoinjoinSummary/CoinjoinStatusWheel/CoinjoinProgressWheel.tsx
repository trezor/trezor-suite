import { useCallback, useState } from 'react';
import styled, { css, DefaultTheme, keyframes } from 'styled-components';
import { Tooltip } from '@trezor/components';
import {
    CoinjoinProgressContent,
    Container as ProgressContentContainer,
} from './CoinjoinProgressContent';
import { lighten, rgba } from 'polished';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    selectCurrentCoinjoinWheelStates,
    selectSessionProgressByAccountKey,
    selectStartCoinjoinSessionArguments,
} from 'src/reducers/wallet/coinjoinReducer';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite/Translation';
import { openModal } from 'src/actions/suite/modalActions';
import { stopCoinjoinSession } from 'src/actions/wallet/coinjoinClientActions';
import {
    startCoinjoinSession,
    coinjoinSessionAutostop,
} from 'src/actions/wallet/coinjoinAccountActions';

export const DELAYED_SPIN = keyframes`
    0% {
        transform: rotate(0deg);
    }
    50% {
        transform: rotate(360deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

const getOutlineSvg = (theme: DefaultTheme) =>
    `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='100' ry='100' stroke='${theme.TYPE_LIGHT_GREY.replace(
        /#/g,
        '%23',
    )}' stroke-width='5' stroke-dasharray='7' stroke-dashoffset='35' stroke-linecap='butt'/%3e%3c/svg%3e")`;

const ProgressIndicator = styled.div`
    position: absolute;
    top: 16px;
    width: 94px;
    height: 94px;
    background: conic-gradient(#fff0 20deg, #ccc);
    border-radius: 50%;
    font-size: 15px;
    animation: ${DELAYED_SPIN} 2.3s cubic-bezier(0.34, 0.45, 0.17, 0.87) infinite;
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
    transition:
        background 0.1s,
        opacity 0.05s;
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

interface CoinjoinProgressWheelProps {
    accountKey: string;
}

export const CoinjoinProgressWheel = ({ accountKey }: CoinjoinProgressWheelProps) => {
    const {
        isSessionActive,
        isPaused,
        isLoading,
        isAutoStopEnabled,
        isCriticalPhase,
        isAllPrivate,
        isAccountEmpty,
        isResumeBlockedByLastingIssue,
        isNonePrivate,
        isCoinjoinUneco,
        isLegalDocumentConfirmed,
    } = useSelector(selectCurrentCoinjoinWheelStates);
    const sessionProgress = useSelector(state =>
        selectSessionProgressByAccountKey(state, accountKey),
    );
    const startCoinjoinArgs = useSelector(state =>
        selectStartCoinjoinSessionArguments(state, accountKey),
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
            if (isCriticalPhase) {
                dispatch(coinjoinSessionAutostop(accountKey, !isAutoStopEnabled));
            } else if (!isAutoStopEnabled) {
                dispatch(stopCoinjoinSession(accountKey));
            }

            return;
        }

        if (isCoinjoinUneco) {
            dispatch(openModal({ type: 'uneco-coinjoin-warning' }));

            return;
        }

        if (isLegalDocumentConfirmed && startCoinjoinArgs) {
            dispatch(startCoinjoinSession(...startCoinjoinArgs));

            return;
        }

        dispatch(goto('wallet-anonymize', { preserveParams: true }));
    }, [
        isCoinjoinSessionBlocked,
        isAllPrivate,
        isAccountEmpty,
        isSessionActive,
        isCriticalPhase,
        isAutoStopEnabled,
        dispatch,
        accountKey,
        isCoinjoinUneco,
        isLegalDocumentConfirmed,
        startCoinjoinArgs,
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
                    <CoinjoinProgressContent
                        accountKey={accountKey}
                        isWheelHovered={isWheelHovered}
                    />
                </Wheel>
            </>
        </Tooltip>
    );
};
