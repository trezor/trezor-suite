import React from 'react';
import styled from 'styled-components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { Navigation } from './Navigation';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { QuickActions } from './QuickActions';
import { ElevationUp, useElevation } from '@trezor/components';
import { SIDEBAR_WIDTH_NUMERIC } from 'src/constants/suite/layout';
import { Elevation, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';
import { RememberWalletNotification } from '../../../../../views/remember-wallet/RememberWalletNotification';

const Container = styled.nav<{ $elevation: Elevation }>`
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    width: ${SIDEBAR_WIDTH_NUMERIC}px;
    resize: horizontal;
    min-width: 200px;
    max-width: 400px;
    height: 100%;
    background: ${mapElevationToBackground};
    border-right: 1px solid ${mapElevationToBorder};
    overflow: auto;
`;

export const Sidebar = () => {
    const { elevation } = useElevation();

    return (
        <Container $elevation={elevation}>
            <ElevationUp>
                <DeviceSelector />
                <RememberWalletNotification />
                <Navigation />
                <AccountsMenu />
                <QuickActions />
            </ElevationUp>
        </Container>
    );
};
