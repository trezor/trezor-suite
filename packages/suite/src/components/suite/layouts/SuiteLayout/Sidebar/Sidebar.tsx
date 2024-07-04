import React from 'react';
import styled from 'styled-components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { Navigation } from './Navigation';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { QuickActions } from './QuickActions';
import { ElevationUp, ResizableBox, useElevation } from '@trezor/components';
import { SIDEBAR_WIDTH_NUMERIC } from 'src/constants/suite/layout';
import { Elevation, mapElevationToBackground, mapElevationToBorder, zIndices } from '@trezor/theme';

const Container = styled.nav<{ $elevation: Elevation }>`
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    height: 100%;
    background: ${mapElevationToBackground};
    border-right: 1px solid ${mapElevationToBorder};
`;

const Wrapper = styled.div`
    display: flex;
`;

export const Sidebar = () => {
    const { elevation } = useElevation();

    return (
        <Wrapper>
            <ResizableBox
                directions={['right']}
                width={SIDEBAR_WIDTH_NUMERIC}
                minWidth={230}
                maxWidth={400}
                zIndex={zIndices.draggableComponent}
                updateHeightOnWindowResize
            >
                <Container $elevation={elevation}>
                    <ElevationUp>
                        <DeviceSelector />
                        <Navigation />
                        <AccountsMenu />
                        <QuickActions />
                    </ElevationUp>
                </Container>
            </ResizableBox>
        </Wrapper>
    );
};
