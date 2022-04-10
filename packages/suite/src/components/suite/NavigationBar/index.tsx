import React, { useState } from 'react';
import styled from 'styled-components';

import { useLayoutSize } from '@suite-hooks';
import { Icon, useTheme, variables } from '@trezor/components';
import { DeviceSelector } from './components/DeviceSelector';
import { MainNavigation } from './components/MainNavigation';
import { NavigationActions } from './components/NavigationActions';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 64px;
    flex: 0;
    z-index: ${variables.Z_INDEX.NAVIGATION_BAR};
    padding: 6px 8px;
    align-items: center;
    background: ${({ theme }) => theme.BG_WHITE};
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};

    @media screen and (min-width: ${variables.SCREEN_SIZE.LG}) {
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
    z-index: ${variables.Z_INDEX.NAVIGATION_BAR};
`;

const ExpandedMobileNavigation = styled.div`
    display: flex;
    position: absolute;
    flex-direction: column;
    background: ${({ theme }) => theme.BG_WHITE};
    z-index: 3;
    width: 100%;
    height: 100%;
`;

export const NavigationBar: React.FC = () => {
    const [opened, setOpened] = useState(false);

    const { isMobileLayout } = useLayoutSize();
    const theme = useTheme();

    const closeMainNavigation = () => {
        setOpened(false);
    };

    if (isMobileLayout) {
        return (
            <>
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

                {opened && (
                    <MobileNavigationWrapper>
                        <ExpandedMobileNavigation>
                            <MainNavigation
                                isMobileLayout={isMobileLayout}
                                closeMainNavigation={closeMainNavigation}
                            />
                            <NavigationActions
                                isMobileLayout={isMobileLayout}
                                closeMainNavigation={closeMainNavigation}
                            />
                        </ExpandedMobileNavigation>
                    </MobileNavigationWrapper>
                )}
            </>
        );
    }

    return (
        <Wrapper>
            <DeviceSelector />
            <MainNavigation />
            <NavigationActions />
        </Wrapper>
    );
};
