import { useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { zIndices } from '@trezor/theme';
import { Icon, variables } from '@trezor/components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { MainNavigation } from './MainNavigation';
import { NavigationActions } from './NavigationActions/NavigationActions';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 64px;
    flex: 0;
    z-index: ${zIndices.navigationBar};
    padding: 6px 8px;
    align-items: center;
    background: ${({ theme }) => theme.BG_WHITE};
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};

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
    background: ${({ theme }) => theme.BG_WHITE};
    width: 100%;
    height: 100%;
`;

export const MobileNavigation = () => {
    const [opened, setOpened] = useState(false);

    const theme = useTheme();

    const closeMainNavigation = () => {
        setOpened(false);
    };

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
                        <MainNavigation isMobileLayout closeMainNavigation={closeMainNavigation} />
                        <NavigationActions
                            isMobileLayout
                            closeMainNavigation={closeMainNavigation}
                        />
                    </ExpandedMobileNavigation>
                </MobileNavigationWrapper>
            )}
        </>
    );
};
