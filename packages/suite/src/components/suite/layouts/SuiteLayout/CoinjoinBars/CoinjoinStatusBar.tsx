import styled, { css } from 'styled-components';

import { selectRoundsDurationInHours, selectSessionProgressByAccountKey } from '@suite/coinjoin';
import { type CoinjoinSession } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { gotoThunk, selectRouterParams } from '@suite/router';
import { selectDeviceThunk, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type WalletParams } from '@suite-common/wallet-types';
import { ProgressPie } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { typography } from '@trezor/theme';

import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { WalletLabeling } from 'src/components/suite/labeling/WalletLabeling';
import { ROUND_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { useSelector } from 'src/hooks/suite';

const SPACING = 6;
// Lines the bar content up with the page content below it.
const HORIZONTAL_PADDING = 16;

const ViewText = styled.div`
    flex-shrink: 0;
    padding-left: ${SPACING}px;
    color: ${({ theme }) => theme.contentSecondary};
    transition: transform 0.15s ease-in-out;
`;

const Container = styled.div<{ $isClickable: boolean }>`
    display: flex;
    align-self: stretch;
    align-items: center;
    height: 28px;
    padding: 0 ${HORIZONTAL_PADDING}px;
    background: ${({ theme }) => theme.surfaceFillSunken};
    border-bottom: 1px solid ${({ theme }) => theme.borderNeutral};
    ${typography['body-xs']}
    transition: background 0.15s;
    ${({ $isClickable, theme }) =>
        $isClickable &&
        css`
            cursor: pointer;
            -webkit-app-region: no-drag;

            &:hover {
                background: ${theme.surfaceFillPage};
                ${ViewText} {
                    text-decoration: underline;
                    transform: translateX(-4px);
                }
            }
        `}
`;

// The bar has a fixed height, so on narrow windows the text is truncated instead of wrapped.
const Content = styled.div`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: ${({ theme }) => theme.contentSecondary};
`;

const StatusText = styled.span`
    color: ${({ theme }) => theme.contentBrand};
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

    const { dispatch } = useServices(injectDispatch);

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
            gotoThunk({
                routeName: 'wallet-index',
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

            <Content>
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
                    <>
                        <Separator>•</Separator>
                        {/* The overtime copy is only the time value, not a replacement for the sentence. */}
                        <Translation
                            id="TR_COINJOIN_ROUND_COUNTDOWN_PLURAL"
                            values={{
                                value: (
                                    <CountdownTimer
                                        isApproximate
                                        deadline={roundPhaseDeadline}
                                        pastDeadlineMessage="TR_COINJOIN_ROUND_COUNTDOWN_OVERTIME"
                                    />
                                ),
                            }}
                        />
                    </>
                )}

                {!isSingle && (
                    <>
                        <Separator>•</Separator>
                        <WalletLabeling device={relatedDevice} shouldUseDeviceLabel />
                    </>
                )}
            </Content>

            {isStatusBarClickable && (
                <ViewText>
                    <Translation id="TR_VIEW" />
                </ViewText>
            )}
        </Container>
    );
};
