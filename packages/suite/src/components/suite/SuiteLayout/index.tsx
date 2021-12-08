import React, { useState, createContext, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { KEYBOARD_CODE, variables } from '@trezor/components';
import SuiteBanners from '@suite-components/Banners';
import { Metadata } from '@suite-components';
import { GuidePanel, GuideButton } from '@guide-components';
import MenuSecondary from '@suite-components/MenuSecondary';
import { MAX_WIDTH } from '@suite-constants/layout';
import { DiscoveryProgress } from '@wallet-components';
import NavigationBar from '../NavigationBar';
import { useLayoutSize, useSelector, useActions, useAnalytics } from '@suite-hooks';
import * as guideActions from '@suite-actions/guideActions';
import { MODAL } from '@suite-actions/constants';

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100vh;
    overflow-x: hidden;
`;

const Body = styled.div<{ isGuideAboveModal?: boolean }>`
    position: ${props => (props.isGuideAboveModal ? `unset` : `relative`)};
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

const StyledGuidePanel = styled(GuidePanel)<{ open?: boolean; isModalOpen?: boolean }>`
    height: 100%;
    width: ${variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH};
    flex: 0 0 ${variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH};
    z-index: ${props =>
        props.isModalOpen
            ? variables.Z_INDEX.GUIDE_PANEL_BESIDE_MODAL
            : variables.Z_INDEX.GUIDE_PANEL};
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

    ${props =>
        props.isModalOpen &&
        css`
            top: 0;
            bottom: 0;
        `}
`;

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
    isModalOpen?: boolean;
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

const BodyNormal = ({
    url,
    menu,
    appMenu,
    children,
    guideOpen,
    isMenuInline,
    isModalOpen,
}: NormalBodyProps) => (
    <Body isGuideAboveModal={isModalOpen && guideOpen}>
        <Columns guideOpen={guideOpen}>
            {!isMenuInline && menu && <MenuSecondary>{menu}</MenuSecondary>}
            <ScrollAppWrapper url={url}>
                {isMenuInline && menu}
                {appMenu}
                <DefaultPaddings>
                    <MaxWidthWrapper>{children}</MaxWidthWrapper>
                </DefaultPaddings>
            </ScrollAppWrapper>
            {guideOpen && (
                <StyledGuidePanel
                    isModalOpen={isModalOpen}
                    data-test="@guide/panel"
                    open={guideOpen}
                />
            )}
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

const SuiteLayout: React.FC = ({ children }) => {
    const analytics = useAnalytics();

    // TODO: if (props.layoutSize === 'UNAVAILABLE') return <SmallLayout />;
    const { isMobileLayout, layoutSize } = useLayoutSize();
    const { router, guideOpen, isModalOpen } = useSelector(state => ({
        router: state.router,
        guideOpen: state.guide.open,
        // 2 types of modals exist. 1. redux 'modal' based, 2. redux 'router' based
        isModalOpen:
            state.modal.context !== MODAL.CONTEXT_NONE || state.router.route?.isForegroundApp,
    }));
    const { openGuide, closeGuide } = useActions({
        openGuide: guideActions.open,
        closeGuide: guideActions.close,
    });

    const onGuideKeys = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === KEYBOARD_CODE.ESCAPE) {
                if (isModalOpen) return;
                if (guideOpen) {
                    closeGuide();
                }
            }

            if (event.key === KEYBOARD_CODE.FUNCTION_KEY_ONE) {
                if (!guideOpen) openGuide();
                else closeGuide();
            }
        },
        [guideOpen, isModalOpen, closeGuide, openGuide],
    );

    useEffect(() => {
        document.addEventListener('keydown', onGuideKeys);
        return () => {
            document.removeEventListener('keydown', onGuideKeys);
        };
    }, [onGuideKeys]);

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
                        url={router.url}
                        guideOpen={guideOpen}
                        isMenuInline={isMenuInline}
                        isModalOpen={isModalOpen}
                    >
                        {children}
                    </BodyNormal>
                )}
                {isMobileLayout && (
                    <BodyMobile menu={menu} appMenu={appMenu} url={router.url}>
                        {children}
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

export default SuiteLayout;
