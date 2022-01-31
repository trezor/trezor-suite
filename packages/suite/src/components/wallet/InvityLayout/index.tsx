import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { WalletLayout } from '@wallet-components';
import { Card, variables } from '@trezor/components';
import type { AppState } from '@suite-types';
import InvityLayoutHeader from './components/InvityLayoutHeader';
import SavingsSteps from './components/SavingsSteps';

const Content = styled.div<{ showStepsGuide: boolean }>`
    padding: 29px 41px;
    width: ${props => (props.showStepsGuide ? 'calc(100% - 221px)' : '100%')};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 29px 20px;
    }
`;

const InvityCard = styled(Card)`
    display: flex;
    flex-direction: row;
`;

export interface InvityLayoutProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
    showStepsGuide?: boolean;
}

const InvityLayout = ({
    children,
    selectedAccount,
    showStepsGuide = false,
}: PropsWithChildren<InvityLayoutProps>) => (
    <WalletLayout title="TR_NAV_INVITY" account={selectedAccount}>
        <InvityLayoutHeader title="TR_NAV_INVITY" selectedAccount={selectedAccount} />
        <InvityCard noPadding>
            {showStepsGuide && <SavingsSteps />}
            <Content showStepsGuide={showStepsGuide}>{children}</Content>
        </InvityCard>
    </WalletLayout>
);

export default InvityLayout;
