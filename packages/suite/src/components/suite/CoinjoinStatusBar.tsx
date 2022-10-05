import React from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { Translation } from './Translation';
import { CoinjoinSession, WalletParams } from '@suite-common/wallet-types';
import { CountdownTimer } from './CountdownTimer';
import { useActions } from '@suite-hooks/useActions';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { useSelector } from '@suite-hooks/useSelector';
import { STATUS as DiscoveryStatus } from '@wallet-actions/constants/discoveryConstants';
import { TranslationKey } from '@suite-common/intl-types';
import { WalletLabeling } from './Labeling';

const SPACING = 6;

const Container = styled.div`
    display: flex;
    align-items: center;
    height: 28px;
    padding: 0 ${SPACING}px;
    background: ${({ theme }) => theme.BG_WHITE};
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ProgressPie = styled.div<{ progress: number }>`
    width: 16px;
    height: 16px;
    margin-right: ${SPACING}px;
    border-radius: 50%;
    background: ${({ theme, progress }) =>
        `conic-gradient(${theme.BG_GREEN} ${3.6 * progress}deg, ${theme.STROKE_GREY} 0)`};
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

const ViewButton = styled(Button)`
    height: 20px;
    margin-left: auto;
`;

enum MockCoinjoinPhase {
    Starting,
    Ongoing,
    Error,
}

const PHASE_MESSAGES: Record<MockCoinjoinPhase, TranslationKey> = {
    [MockCoinjoinPhase.Starting]: 'TR_COINJOIN_PHASE_0_MESSAGE',
    [MockCoinjoinPhase.Ongoing]: 'TR_COINJOIN_PHASE_1_MESSAGE',
    [MockCoinjoinPhase.Error]: 'TR_COINJOIN_PHASE_2_MESSAGE',
};

interface CoinjoinStatusBarProps {
    accountKey: string;
    session: CoinjoinSession;
    isSingle: boolean;
}

export const CoinjoinStatusBar = ({ accountKey, session, isSingle }: CoinjoinStatusBarProps) => {
    const devices = useSelector(state => state.devices);
    const accounts = useSelector(state => state.wallet.accounts);
    const selectedDevice = useSelector(state => state.suite.device);
    const routerParams = useSelector(state => state.router.params);
    const discovery = useSelector(state => state.wallet.discovery);

    const { goto, selectDevice } = useActions({
        goto: routerActions.goto,
        selectDevice: suiteActions.selectDevice,
    });

    const relatedAccount = accounts?.find(account => account?.key === accountKey);

    if (!relatedAccount) {
        return null;
    }

    const { symbol, index, accountType, deviceState } = relatedAccount;

    const isOnSelectedDevice = selectedDevice?.state === deviceState;
    const relatedDevice = devices.find(device => device.state === deviceState);

    if (!relatedDevice) {
        return null;
    }

    const handleViewAccount = () => {
        if (!isOnSelectedDevice) {
            selectDevice(relatedDevice);
        }

        goto('wallet-index', {
            params: {
                symbol,
                accountIndex: index,
                accountType,
            },
        });
    };

    const { signedRounds, maxRounds, deadline } = session;

    const phase = MockCoinjoinPhase.Ongoing; // TEMPORARY
    const progress = signedRounds.length / (maxRounds / 100);

    const {
        symbol: symbolParam,
        accountIndex: indexParam,
        accountType: accountTypeParam,
    } = (routerParams as WalletParams) || {};

    const isOnAccountPage =
        symbolParam === symbol && indexParam === index && accountTypeParam === accountType;

    const areDevicesDiscovered = devices.every(({ state }) =>
        discovery.find(
            discoveryState =>
                discoveryState.deviceState === state &&
                discoveryState.status === DiscoveryStatus.COMPLETED,
        ),
    );

    return (
        <Container>
            <ProgressPie progress={progress} />

            <StatusText>
                <Translation id={PHASE_MESSAGES[phase]} />

                <Separator>•</Separator>

                <Translation
                    id="TR_COINJOIN_COUNTDOWN"
                    values={{ rounds: maxRounds - signedRounds.length }}
                />
            </StatusText>

            {session?.deadline && (
                <Note>
                    <Separator>•</Separator>

                    <Translation
                        id="TR_COINJOIN_ROUND_COUNTDOWN"
                        values={{
                            time: <CountdownTimer deadline={deadline} />,
                        }}
                    />
                </Note>
            )}

            {!isSingle && (
                <Note>
                    <Separator>•</Separator>
                    <WalletLabeling device={relatedDevice} shouldUseDeviceLabel />
                </Note>
            )}

            {((isOnSelectedDevice && !isOnAccountPage) ||
                (!isOnSelectedDevice && areDevicesDiscovered)) && (
                <ViewButton variant="tertiary" onClick={handleViewAccount}>
                    <Translation id="TR_VIEW" />
                </ViewButton>
            )}
        </Container>
    );
};
