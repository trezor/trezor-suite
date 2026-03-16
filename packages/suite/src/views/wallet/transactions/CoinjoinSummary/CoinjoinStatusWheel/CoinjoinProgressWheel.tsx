import { useCallback, useState } from 'react';

import { lighten, rgba } from 'polished';
import styled, { type DefaultTheme, css, keyframes } from 'styled-components';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { type AccountKey } from '@suite-common/wallet-types';
import { Tooltip, useElevation } from '@trezor/components';
import { type Elevation, mapElevationToBorder } from '@trezor/theme';

import {
    coinjoinSessionAutostop,
    startCoinjoinSession,
} from 'src/actions/wallet/coinjoinAccountActions';
import { stopCoinjoinSession } from 'src/actions/wallet/coinjoinClientActions';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    selectCurrentCoinjoinWheelStates,
    selectSessionProgressByAccountKey,
    selectStartCoinjoinSessionArguments,
} from 'src/reducers/wallet/coinjoinReducer';

import {
    CoinjoinProgressContent,
    Container as ProgressContentContainer,
} from './CoinjoinProgressContent';

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
    `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='100' ry='100' stroke='${theme.iconSubdued.replace(
        /#/g,
        '%23',
    )}' stroke-width='5' stroke-dasharray='7' stroke-dashoffset='35' stroke-linecap='butt'/%3e%3c/svg%3e")`;

const ProgressIndicator = styled.div`
    position: absolute;
    width: 94px;
    height: 94px;
    background: conic-gradient(#fff0 20deg, #ccc);
    border-radius: 50%;
    font-size: 15px;
    animation: ${DELAYED_SPIN} 2.3s cubic-bezier(0.34, 0.45, 0.17, 0.87) infinite;
`;

const Wheel = styled.div<{
    $progress: number;
    $isPaused: boolean;
    $isHoverDisabled: boolean;
    $hasCriticalError: boolean;
    $hasDottedOutline: boolean;
    $isWithoutProgressOutline: boolean;
    $isStartable: boolean;
    $isGreyedOut: boolean;
    $elevation: Elevation;
}>`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 94px;
    height: 94px;
    border-radius: 50%;
    background: ${({ theme, $progress, $elevation }) =>
        `conic-gradient(${theme.backgroundPrimaryDefault} ${3.6 * $progress}deg, ${rgba(
            mapElevationToBorder({ theme, $elevation }),
            0.6,
        )} 0)`};
    transition:
        background 0.1s,
        opacity 0.05s;
    user-select: none;

    ${({ $isHoverDisabled }) =>
        !$isHoverDisabled &&
        css`
            cursor: pointer;

            &:active {
                ${ProgressContentContainer} {
                    background: ${({ theme }) =>
                        lighten(0.02, theme.backgroundNeutralBoldInverted)};
                }
            }
        `}

    ${({ $isWithoutProgressOutline }) =>
        $isWithoutProgressOutline &&
        css`
            background: none;
            color: ${({ theme }) => theme.textPrimaryDefault};

            ${ProgressContentContainer} {
                background: ${({ theme }) => theme.backgroundPrimaryDefault};

                path {
                    fill: ${({ theme }) => theme.iconPrimaryDefault};
                }
            }
        `}

    ${({ $hasDottedOutline }) =>
        $hasDottedOutline &&
        css`
            opacity: 0.3;
            background: ${({ theme }) => getOutlineSvg(theme)};
            cursor: not-allowed;
        `}

    ${({ $isStartable, $isPaused, $hasCriticalError, theme }) =>
        ($isStartable || $isPaused) &&
        !$hasCriticalError &&
        css`
            &:hover {
                ${ProgressContentContainer} {
                    width: calc(100% - 12px);
                    height: calc(100% - 12px);

                    span {
                        color: ${theme.textPrimaryDefault};
                    }
                }
            }
        `}

    ${({ $isPaused, $hasCriticalError, theme, $progress, $elevation }) =>
        $isPaused &&
        css`
            background: ${`conic-gradient(${theme.backgroundSurfaceElevation0} ${3.6 * $progress}deg, ${rgba(
                mapElevationToBorder({ theme, $elevation }),
                0.6,
            )} 0)`};

            &:hover {
                path {
                    fill: ${!$hasCriticalError && theme.iconPrimaryDefault};
                }
            }
        `}

    ${({ $isGreyedOut, theme }) =>
        $isGreyedOut &&
        css`
            filter: grayscale(1);
            color: inherit;

            ${ProgressContentContainer} {
                background: ${theme.backgroundNeutralBoldInverted};
            }
        `}
`;

interface CoinjoinProgressWheelProps {
    accountKey: AccountKey;
}

export const CoinjoinProgressWheel = ({ accountKey }: CoinjoinProgressWheelProps) => {
    const { elevation } = useElevation();
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

        dispatch(goto({ routeName: 'wallet-anonymize', preserveParams: true }));
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
        <Tooltip content={getTooltipMessage()}>
            <div>
                {isProgressIndicatorShown && <ProgressIndicator />}

                <Wheel
                    $progress={sessionProgress}
                    $isPaused={isPaused}
                    $isHoverDisabled={isHoverDisabled}
                    $hasCriticalError={hasCriticalError}
                    $isGreyedOut={hasCriticalError}
                    $hasDottedOutline={hasDottedOutline}
                    $isWithoutProgressOutline={isWithoutProgressOutline}
                    $isStartable={isSessionStartable}
                    onClick={handleWheelClick}
                    onMouseEnter={() => setIsWheelHovered(true)}
                    onMouseLeave={() => setIsWheelHovered(false)}
                    $elevation={elevation}
                >
                    <CoinjoinProgressContent
                        accountKey={accountKey}
                        isWheelHovered={isWheelHovered}
                    />
                </Wheel>
            </div>
        </Tooltip>
    );
};
