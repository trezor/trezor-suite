import styled, { css } from 'styled-components';

import {
    selectDevice,
    selectDevices,
    selectAccountByKey,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { ProgressPie, variables } from '@trezor/components';
import { WalletParams } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';
import { CoinjoinSession } from 'src/types/wallet/coinjoin';
import { ROUND_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { goto } from 'src/actions/suite/routerActions';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectRouterParams } from 'src/reducers/suite/routerReducer';
import {
    selectSessionProgressByAccountKey,
    selectRoundsDurationInHours,
} from 'src/reducers/wallet/coinjoinReducer';
import { CountdownTimer, Translation, WalletLabeling } from 'src/components/suite';

const SPACING = 6;

const ViewText = styled.div`
    margin-left: auto;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    transition: transform 0.15s ease-in-out;
`;

const Container = styled.div<{ isClickable: boolean }>`
    display: flex;
    align-items: center;
    height: 28px;
    padding: 0 ${SPACING}px;
    background: ${({ theme }) => theme.BG_WHITE};
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    transition: background 0.15s;
    ${({ isClickable, theme }) =>
        isClickable &&
        css`
            cursor: pointer;

            &:hover {
                background: ${theme.BG_WHITE_ALT_HOVER};
                ${ViewText} {
                    text-decoration: underline;
                    transform: translateX(-4px);
                }
            }
        `}
`;

const StyledProgressPie = styled(ProgressPie)`
    margin-right: ${SPACING}px;
`;

const StatusText = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const Note = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Separator = styled.span`
    margin: 0 ${SPACING / 2}px;
`;

interface CoinjoinStatusBarProps {
    accountKey: string;
    session: CoinjoinSession;
    isSingle: boolean;
}

export const CoinjoinStatusBar = ({ accountKey, session, isSingle }: CoinjoinStatusBarProps) => {
    const devices = useSelector(selectDevices);
    const relatedAccount = useSelector(state => selectAccountByKey(state, accountKey));
    const selectedDevice = useSelector(selectDevice);
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

    const relatedDevice = devices.find(device => device.state === relatedAccount?.deviceState);
    const isOnSelectedDevice = selectedDevice?.state === deviceState;

    if (!relatedDevice) {
        return null;
    }

    const handleViewAccount = () => {
        if (!isOnSelectedDevice) {
            dispatch(selectDeviceThunk(relatedDevice));
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
            isClickable={isStatusBarClickable}
        >
            <StyledProgressPie valueInPercents={sessionProgress} />

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
