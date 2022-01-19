import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { WalletLayout } from '@wallet-components';
import { Card, variables } from '@trezor/components';
import type { AppState } from '@suite-types';
import InvityLayoutHeader from './components/InvityLayoutHeader';

const Content = styled.div`
    padding: 29px 41px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 29px 20px;
    }
`;

export interface InvityLayoutProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

const InvityLayout = ({ children, selectedAccount }: PropsWithChildren<InvityLayoutProps>) => (
    <WalletLayout title="TR_NAV_INVITY" account={selectedAccount}>
        <InvityLayoutHeader title="TR_NAV_INVITY" selectedAccount={selectedAccount} />
        <Card noPadding>
            <Content>{children}</Content>
        </Card>
    </WalletLayout>
);

export default InvityLayout;
