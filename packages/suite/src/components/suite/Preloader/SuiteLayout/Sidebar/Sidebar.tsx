import { spacingsPx } from '@trezor/theme';
import React from 'react';
import styled from 'styled-components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { Navigation } from './Navigation';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { QuickActions } from './QuickActions';

const Container = styled.nav`
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    gap: ${spacingsPx.xs};
    width: 240px;
    height: 100%;
    padding: ${spacingsPx.xs};
    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    border-right: 1px solid ${({ theme }) => theme.borderOnElevation0};
    overflow: auto;
`;

export const Sidebar = () => (
    <Container>
        <DeviceSelector />
        <Navigation />
        <AccountsMenu />
        <QuickActions />
    </Container>
);
