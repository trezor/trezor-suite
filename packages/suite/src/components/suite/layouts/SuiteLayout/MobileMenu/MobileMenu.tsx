import { useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { zIndices } from '@trezor/theme';
import { Icon, variables } from '@trezor/components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { MobileNavigation } from './MobileNavigation';
import { MobileMenuActions } from './MobileMenuActions';
import { TrafficLightOffset } from '../../../TrafficLightOffset';

const BackgroundContainer = styled.div`
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
`;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 64px;
    flex: 0;
    z-index: ${zIndices.navigationBar};
    padding: 6px 8px;
    align-items: center;

    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};

    ${variables.SCREEN_QUERY.ABOVE_LAPTOP} {
        padding: 10px 16px;
    }
`;

const HamburgerWrapper = styled.div`
    display: flex;
    padding-right: 12px;
    flex: 1;
    justify-content: flex-end;
`;

const MobileNavigationWrapper = styled.div`
    position: relative;
    height: 100vh;
    z-index: ${zIndices.navigationBar};
`;

const ExpandedMobileNavigation = styled.div`
    display: flex;
    position: absolute;
    flex-direction: column;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    width: 100%;
    height: 100%;
`;

export const MobileMenu = () => {
    const [opened, setOpened] = useState(false);

    const theme = useTheme();

    const closeMobileNavigation = () => {
        setOpened(false);
    };

    return (
        <>
            <BackgroundContainer>
                <TrafficLightOffset>
                    <Wrapper>
                        <DeviceSelector />
                        <HamburgerWrapper>
                            <Icon
                                onClick={() => setOpened(!opened)}
                                icon={opened ? 'CROSS' : 'MENU'}
                                size={24}
                                color={theme.TYPE_DARK_GREY}
                            />
                        </HamburgerWrapper>
                    </Wrapper>
                </TrafficLightOffset>
            </BackgroundContainer>

            {opened && (
                <MobileNavigationWrapper>
                    <ExpandedMobileNavigation>
                        <MobileNavigation closeMobileNavigation={closeMobileNavigation} />
                        <MobileMenuActions closeMobileNavigation={closeMobileNavigation} />
                    </ExpandedMobileNavigation>
                </MobileNavigationWrapper>
            )}
        </>
    );
};
