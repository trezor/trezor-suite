import React, { useState } from 'react';
import DeviceSelector from './components/DeviceSelector';
import MainNavigation from './components/MainNavigation';
import NavigationActions from './components/NavigationActions';
import styled from 'styled-components';
import { colors, Icon } from '@trezor/components';
import { useLayoutSize } from '@suite-hooks';

const StyledDeviceSelector = styled(DeviceSelector)``;

const StyledNavigationBar = styled.div<{ isMobileLayout: boolean }>`
    display: flex;
    width: 100%;
    min-height: 80px;
    flex: 0;
    z-index: 3;
    padding: ${props => (!props.isMobileLayout ? '6px 32px 6px 8px' : '6px 8px')};
    align-items: center;
    background: ${colors.NEUE_BG_WHITE};
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};

    &:hover ${StyledDeviceSelector} {
        /* apply same device selector's hover styles on hover anywhere in navigation panel */
        border-radius: 4px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
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
`;

const ExpandedMobileNavigation = styled.div`
    display: flex;
    position: absolute;
    flex-direction: column;
    background: ${colors.NEUE_BG_WHITE};
    z-index: 3;
    width: 100%;
    height: 100%;
`;

const HamburgerIcon = styled(Icon)`
    cursor: pointer;
`;

const NavigationBar = () => {
    const [opened, setOpened] = useState(false);
    const { isMobileLayout } = useLayoutSize();

    const closeMainNavigation = () => {
        setOpened(false);
    };

    if (isMobileLayout) {
        return (
            <>
                <StyledNavigationBar isMobileLayout={isMobileLayout}>
                    <StyledDeviceSelector />
                    <HamburgerWrapper>
                        <HamburgerIcon
                            onClick={() => setOpened(!opened)}
                            icon={opened ? 'CROSS' : 'MENU'}
                            size={24}
                            color={colors.NEUE_TYPE_DARK_GREY}
                        />
                    </HamburgerWrapper>
                </StyledNavigationBar>
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
        <StyledNavigationBar isMobileLayout={isMobileLayout}>
            <StyledDeviceSelector />
            <MainNavigation />
            <NavigationActions />
        </StyledNavigationBar>
    );
};

export default NavigationBar;
