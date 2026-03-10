import styled, { css } from 'styled-components';

import { Translation } from '@suite/intl';
import { selectRouterParams } from '@suite/router';
import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import { selectAccountByKey, selectDeviceThunk } from '@suite-common/wallet-core';
import { AccountKey, WalletParams } from '@suite-common/wallet-types';
import { ProgressPie } from '@trezor/components';
import { typography } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { WalletLabeling } from 'src/components/suite/labeling';
import { ROUND_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    selectRoundsDurationInHours,
    selectSessionProgressByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';
import { CoinjoinSession } from 'src/types/wallet/coinjoin';

const SPACING = 6;

const ViewText = styled.div`
    margin-left: auto;
    color: ${({ theme }) => theme.textSubdued};
    transition: transform 0.15s ease-in-out;
`;

const Container = styled.div<{ $isClickable: boolean }>`
    display: flex;
    align-self: stretch;
    align-items: center;
    height: 28px;
    padding: 0 ${SPACING}px;
    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    ${typography['body-xs']}
    transition: background 0.15s;
    ${({ $isClickable, theme }) =>
        $isClickable &&
        css`
            cursor: pointer;

            &:hover {
                background: ${theme.backgroundSurfaceElevation0};
                ${ViewText} {
                    text-decoration: underline;
                    transform: translateX(-4px);
                }
            }
        `}
`;

const StatusText = styled.span`
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

const Note = styled.span`
    color: ${({ theme }) => theme.textSubdued};
`;

const Separator = styled.span`
    margin: 0 ${SPACING / 2}px;
`;

interface CoinjoinStatusBarProps {
    accountKey: AccountKey;
    session: CoinjoinSession;
    isSingle: boolean;
}

export const CoinjoinStatusBar = ({ accountKey, session, isSingle }: CoinjoinStatusBarProps) => {
    const devices = useSelector(selectDevices);
    const relatedAccount = useSelector(state => selectAccountByKey(state, accountKey));
    const selectedDevice = useSelector(selectSelectedDevice);
    const routerParams = useSelector(selectRouterParams);
    const sessionProgress = useSelector(state =>
        selectSessionProgressByAccountKey(state, accountKey),
    );
    const roundsDurationInHours = useSelector(selectRoundsDurationInHours);

    const dispatch = useDispatch();

    if (!relatedAccount) {
        return null;
    }

    const { symbol, index, accountType, deviceState } = relatedAccount;

    const relatedDevice = devices.find(
        device => device.state?.staticSessionId === relatedAccount?.deviceState,
    );
    const isOnSelectedDevice = selectedDevice?.state?.staticSessionId === deviceState;

    if (!relatedDevice) {
        return null;
    }

    const handleViewAccount = () => {
        if (!isOnSelectedDevice) {
            dispatch(selectDeviceThunk({ device: relatedDevice }));
        }

        dispatch(
            goto('wallet-index', {
                params: {
                    symbol,
                    accountIndex: index,
                    accountType,
                },
            }),
        );
    };

    const { roundPhase, roundPhaseDeadline, sessionDeadline, paused } = session;

    const getSessionStatusMessage = () => {
        if (paused) {
            return <Translation id="TR_PAUSED" />;
        }

        if (roundPhase === undefined) {
            return <Translation id="TR_LOOKING_FOR_COINJOIN_ROUND" />;
        }

        return <Translation id={ROUND_PHASE_MESSAGES[roundPhase]} />;
    };

    const {
        symbol: symbolParam,
        accountIndex: indexParam,
        accountType: accountTypeParam,
    } = (routerParams as WalletParams) || {};

    const isOnAccountPage =
        symbolParam === symbol && indexParam === index && accountTypeParam === accountType;
    const isStatusBarClickable = (isOnSelectedDevice && !isOnAccountPage) || !isOnSelectedDevice;

    return (
        <Container
            onClick={isStatusBarClickable ? handleViewAccount : undefined}
            $isClickable={isStatusBarClickable}
        >
            <ProgressPie valueInPercents={sessionProgress} margin={{ right: 8 }} />

            <StatusText>
                {getSessionStatusMessage()}

                {sessionDeadline && (
                    <>
                        <Separator>•</Separator>
                        <CountdownTimer
                            deadline={sessionDeadline}
                            unitDisplay="long"
                            minUnit="hour"
                            minUnitValue={roundsDurationInHours}
                            message="TR_COINJOIN_SESSION_COUNTDOWN_PLURAL"
                        />
                    </>
                )}
            </StatusText>

            {roundPhase !== undefined && !paused && roundPhaseDeadline && (
                <Note>
                    <Separator>•</Separator>

                    <CountdownTimer
                        isApproximate
                        deadline={roundPhaseDeadline}
                        message="TR_COINJOIN_ROUND_COUNTDOWN_PLURAL"
                        pastDeadlineMessage="TR_COINJOIN_ROUND_COUNTDOWN_OVERTIME"
                    />
                </Note>
            )}

            {!isSingle && (
                <Note>
                    <Separator>•</Separator>
                    <WalletLabeling device={relatedDevice} shouldUseDeviceLabel />
                </Note>
            )}

            {isStatusBarClickable && (
                <ViewText>
                    <Translation id="TR_VIEW" />
                </ViewText>
            )}
        </Container>
    );
};
