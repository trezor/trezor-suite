import { useMemo, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { Icon, variables } from '@trezor/components';
import { CoinjoinStatusBar } from './CoinjoinStatusBar';
import { DeviceSelector } from './DeviceSelector/DeviceSelector';
import { MainNavigation } from './MainNavigation';
import { NavigationActions } from './NavigationActions/NavigationActions';

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
    z-index: ${variables.Z_INDEX.NAVIGATION_BAR};
`;

const ExpandedMobileNavigation = styled.div`
    display: flex;
    position: absolute;
    flex-direction: column;
    background: ${({ theme }) => theme.BG_WHITE};
    width: 100%;
    height: 100%;
`;

export const NavigationBar = () => {
    const coinjoinAccounts = useSelector(state => state.wallet.coinjoin.accounts);
    const [opened, setOpened] = useState(false);

    const { isMobileLayout } = useLayoutSize();
    const theme = useTheme();

    const closeMainNavigation = () => {
        setOpened(false);
    };

    let sessionCount = 0;
    coinjoinAccounts.forEach(({ session }) => {
        if (session) {
            sessionCount++;
        }
    });

    const coinjoinStatusBars = useMemo(
        () =>
            coinjoinAccounts?.map(({ key, session }) => {
                if (!session) {
                    return;
                }

                return (
                    <CoinjoinStatusBar
                        accountKey={key}
                        session={session}
                        isSingle={sessionCount === 1}
                        key={key}
                    />
                );
            }),
        [coinjoinAccounts, sessionCount],
    );

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
        <>
            {coinjoinStatusBars}

            <Wrapper>
                <DeviceSelector />
                <MainNavigation />
                <NavigationActions />
            </Wrapper>
        </>
    );
};
