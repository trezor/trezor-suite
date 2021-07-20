import React, { useState, createContext } from 'react';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import { useHotkeys } from 'react-hotkeys-hook';

import { variables } from '@trezor/components';
import SuiteBanners from '@suite-components/Banners';
import { AppState } from '@suite-types';
import { Metadata } from '@suite-components';
import { GuidePanel, GuideButton } from '@guide-components';
import MenuSecondary from '@suite-components/MenuSecondary';
import { MAX_WIDTH, DESKTOP_TITLEBAR_HEIGHT } from '@suite-constants/layout';
import { DiscoveryProgress } from '@wallet-components';
import NavigationBar from '../NavigationBar';
import { useLayoutSize, useSelector, useActions, useAnalytics } from '@suite-hooks';
import { isDesktop } from '@suite-utils/env';
import * as guideActions from '@suite-actions/guideActions';

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    height: ${isDesktop() ? `calc(100vh - ${DESKTOP_TITLEBAR_HEIGHT})` : '100vh'};
    overflow-x: hidden;
`;

const Body = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: hidden;
    overflow-x: hidden;
`;

// AppWrapper and MenuSecondary creates own scrollbars independently
const Columns = styled.div<{ guideOpen?: boolean }>`
    display: flex;
    flex-direction: row;
    flex: 1 0 100%;
    overflow: auto;
    padding: 0;
    transition: all 0.3s ease;

    ${props =>
        props.guideOpen &&
        css`
            padding: 0 ${variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH} 0 0;
        `}
`;

const AppWrapper = styled.div`
    display: flex;
    color: ${props => props.theme.TYPE_DARK_GREY};
    background: ${props => props.theme.BG_GREY};
    flex-direction: column;
    overflow-x: auto;
    overflow-y: scroll;
    width: 100%;
    align-items: center;
    position: relative;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        overflow-x: hidden;
    }
`;

const MaxWidthWrapper = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
    max-width: ${MAX_WIDTH};
`;

const DefaultPaddings = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 24px 32px 90px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 24px 16px 70px 16px;
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-bottom: 50px;
    }
`;

const StyledGuidePanel = styled(GuidePanel)<{ open?: boolean }>`
    height: 100%;
    width: ${variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH};
    flex: 0 0 ${variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH};
    z-index: ${variables.Z_INDEX.GUIDE_PANEL};
    border-left: 1px solid ${props => props.theme.STROKE_GREY};
    position: absolute;
    right: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;

    ${props =>
        props.open &&
        css`
            transform: translateX(0);
        `}
`;

const mapStateToProps = (state: AppState) => ({
    router: state.router,
});

type Props = ReturnType<typeof mapStateToProps> & {
    children?: React.ReactNode;
};

interface MobileBodyProps {
    url: string;
    menu?: React.ReactNode;
    appMenu?: React.ReactNode;
    // false positive - https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unused-prop-types.md#false-positives-sfc
    // eslint-disable-next-line react/no-unused-prop-types
    guideOpen?: boolean;
    children?: React.ReactNode;
}

interface NormalBodyProps extends MobileBodyProps {
    isMenuInline: boolean;
}

interface LayoutContextI {
    title?: string;
    menu?: React.ReactNode;
    isMenuInline?: boolean;
    appMenu?: React.ReactNode;
    setLayout?: (title?: string, menu?: React.ReactNode, appMenu?: React.ReactNode) => void;
}

export const LayoutContext = createContext<LayoutContextI>({
    title: undefined,
    menu: undefined,
    isMenuInline: undefined,
    appMenu: undefined,
    setLayout: undefined,
});

type ScrollAppWrapperProps = Pick<MobileBodyProps, 'url' | 'children'>;
// ScrollAppWrapper is mandatory to reset AppWrapper scroll position on url change, fix: issue #1658
const ScrollAppWrapper = ({ url, children }: ScrollAppWrapperProps) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const { current } = ref;
        if (!current) return;
        current.scrollTop = 0; // reset scroll position on url change
    }, [ref, url]);
    return <AppWrapper ref={ref}>{children}</AppWrapper>;
};

const BodyNormal = ({ url, menu, appMenu, children, guideOpen, isMenuInline }: NormalBodyProps) => (
    <Body>
        <Columns guideOpen={guideOpen}>
            {!isMenuInline && menu && <MenuSecondary>{menu}</MenuSecondary>}
            <ScrollAppWrapper url={url}>
                {isMenuInline && menu}
                {appMenu}
                <DefaultPaddings>
                    <MaxWidthWrapper>{children}</MaxWidthWrapper>
                </DefaultPaddings>
            </ScrollAppWrapper>
            <StyledGuidePanel open={guideOpen} />
        </Columns>
    </Body>
);

const BodyMobile = ({ url, menu, appMenu, children }: MobileBodyProps) => (
    <Body>
        <Columns>
            <ScrollAppWrapper url={url}>
                {menu}
                {appMenu}
                <DefaultPaddings>{children}</DefaultPaddings>
            </ScrollAppWrapper>
        </Columns>
    </Body>
);

type SuiteLayoutProps = Omit<Props, 'menu' | 'appMenu'>;
const SuiteLayout = (props: SuiteLayoutProps) => {
    const analytics = useAnalytics();

    // TODO: if (props.layoutSize === 'UNAVAILABLE') return <SmallLayout />;
    const { isMobileLayout, layoutSize } = useLayoutSize();
    const { guideOpen } = useSelector(state => ({
        guideOpen: state.guide.open,
    }));
    const { openGuide, closeGuide } = useActions({
        openGuide: guideActions.open,
        closeGuide: guideActions.close,
    });
    useHotkeys(
        'f1,esc',
        e => {
            e.preventDefault();
            if (guideOpen) {
                closeGuide();
            }
            if (!guideOpen && e.key.toLowerCase() === 'f1') {
                openGuide();
            }
        },
        [guideOpen, closeGuide, openGuide],
    );

    const [title, setTitle] = useState<string | undefined>(undefined);
    const [menu, setMenu] = useState<any>(undefined);
    // There are three layout configurations WRT the guide and menu:
    // - On XLARGE viewports menu, body and guide are displayed in three columns.
    // - On viewports wider than mobile but smaller than XLARGE body and menu are
    //   are displayed in two columns unless guide is open. In such case, it takes
    //   its own column and menu is inlined on top of body.
    // - On mobile viewports the guide is simply hidden and menu is inlined on top
    //   of body constantly.
    const isMenuInline = isMobileLayout || (layoutSize !== 'XLARGE' && guideOpen);
    const [appMenu, setAppMenu] = useState<any>(undefined);
    const setLayout = React.useCallback<NonNullable<LayoutContextI['setLayout']>>(
        (newTitle, newMenu, newAppMenu) => {
            setTitle(newTitle);
            setMenu(newMenu);
            setAppMenu(newAppMenu);
        },
        [],
    );

    return (
        <PageWrapper>
            <Metadata title={title} />
            <SuiteBanners />
            <DiscoveryProgress />
            <NavigationBar />
            <LayoutContext.Provider value={{ title, menu, isMenuInline, setLayout }}>
                {!isMobileLayout && (
                    <BodyNormal
                        menu={menu}
                        appMenu={appMenu}
                        url={props.router.url}
                        guideOpen={guideOpen}
                        isMenuInline={isMenuInline}
                    >
                        {props.children}
                    </BodyNormal>
                )}
                {isMobileLayout && (
                    <BodyMobile menu={menu} appMenu={appMenu} url={props.router.url}>
                        {props.children}
                    </BodyMobile>
                )}
            </LayoutContext.Provider>
            {!isMobileLayout && (
                <GuideButton
                    onClick={() => {
                        openGuide();
                        analytics.report({
                            type: 'menu/guide',
                        });
                    }}
                />
            )}
        </PageWrapper>
    );
};

export default connect(mapStateToProps)(SuiteLayout);
