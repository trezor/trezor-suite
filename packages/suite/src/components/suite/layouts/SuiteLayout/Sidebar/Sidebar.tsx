import React from 'react';
import styled from 'styled-components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { Navigation } from './Navigation';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { QuickActions } from './QuickActions';
import { ElevationContext } from '@trezor/components';
import { SIDEBAR_WIDTH_NUMERIC } from 'src/constants/suite/layout';

const Container = styled.nav`
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    width: ${SIDEBAR_WIDTH_NUMERIC}px;
    resize: horizontal;
    min-width: 200px;
    max-width: 400px;
    height: 100%;
    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    border-right: 1px solid ${({ theme }) => theme.borderOnElevation0};
    overflow: auto;
`;

export const Sidebar = () => (
    <Container>
        <ElevationContext baseElevation={-1}>
            <DeviceSelector />
            <Navigation />
            <AccountsMenu />
            <QuickActions />
        </ElevationContext>
    </Container>
);
