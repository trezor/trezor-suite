import React from 'react';
import styled from 'styled-components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { Navigation } from './Navigation';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { QuickActions } from './QuickActions/QuickActions';
import { ElevationUp, ResizableBox, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBackground, mapElevationToBorder, zIndices } from '@trezor/theme';
import { useActions, useSelector } from 'src/hooks/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { TrafficLightOffset } from '../../../TrafficLightOffset';

const Container = styled.nav<{ $elevation: Elevation }>`
    display: flex;
    container-type: inline-size;
    flex-direction: column;
    flex: 0 0 auto;
    height: 100%;
    background: ${mapElevationToBackground};
    border-right: 1px solid ${mapElevationToBorder};
`;

const Wrapper = styled.div`
    display: flex;
`;
const Content = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

export const Sidebar = () => {
    const { elevation } = useElevation();

    const sidebarWidth = useSelector(state => state.suite.settings.sidebarWidth);
    const { setSidebarWidth } = useActions({
        setSidebarWidth: (width: number) => suiteActions.setSidebarWidth({ width }),
    });

    return (
        <Wrapper>
            <ResizableBox
                directions={['right']}
                width={sidebarWidth}
                minWidth={84}
                maxWidth={600}
                zIndex={zIndices.draggableComponent}
                updateHeightOnWindowResize
                onWidthResizeEnd={setSidebarWidth}
                disabledWidthInterval={[84, 240]}
            >
                <Container $elevation={elevation}>
                    <ElevationUp>
                        <TrafficLightOffset>
                            <Content>
                                <DeviceSelector />
                                <Navigation />
                                <AccountsMenu />
                                <QuickActions />
                            </Content>
                        </TrafficLightOffset>
                    </ElevationUp>
                </Container>
            </ResizableBox>
        </Wrapper>
    );
};
