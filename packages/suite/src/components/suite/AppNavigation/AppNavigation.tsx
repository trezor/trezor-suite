import { useRef, useLayoutEffect, useState, ReactNode } from 'react';

import styled, { css } from 'styled-components';

import {
    variables,
    IconProps,
    Button,
    Dropdown,
    DropdownMenuItemProps,
    ButtonGroup,
} from '@trezor/components';
import { zIndices } from '@trezor/theme';
import { Route } from '@suite-common/suite-types';

import { AccountFormCloseButton, HoverAnimation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { AccountStickyContent } from './AccountStickyContent';
import { AppNavigationTooltip } from './AppNavigationTooltip';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const SECONDARY_MENU_BUTTON_MARGIN = '12px';
export const SECONDARY_PANEL_HEIGHT = '60px';

const Wrapper = styled.div<{ subRoute: boolean | undefined; inView?: boolean }>`
    width: 100%;
    z-index: ${zIndices.stickyBar};
    display: flex;
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
    justify-content: center;
    position: sticky;
    inset: 0;
    height: 0;

    ${props =>
        !props.subRoute &&
        css`
            margin-bottom: ${SECONDARY_PANEL_HEIGHT};
        `}

    ${props =>
        props.subRoute &&
        props.inView &&
        css`
            transform: translate(0, -${SECONDARY_PANEL_HEIGHT});
        `}
    ${props =>
        props.subRoute &&
        !props.inView &&
        css`
            transition: all 0.3s ease 0s;
            transform: translate(0, 0);
        `}
`;

const MenuHolder = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH};
    scrollbar-width: none; /* Firefox */
    position: relative;
    border-top: none;
    transition: all 0.3s ease;

    ::-webkit-scrollbar {
        width: 0;
        height: 0;
    }
`;

const KeepWidth = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH};
`;

const Primary = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
`;

const Secondary = styled.div`
    display: flex;
    align-items: center;
`;

const SecondaryMenu = styled.div<{ visible: boolean }>`
    display: flex;
    align-items: center;
    ${props => !props.visible && `display: none;`}

    & > * + * {
        margin-left: ${SECONDARY_MENU_BUTTON_MARGIN};
    }
`;

const MenuElement = styled.div<{ isActive: boolean }>`
    position: relative;
    height: ${SECONDARY_PANEL_HEIGHT};
    font-size: ${FONT_SIZE.NORMAL};
    color: ${({ isActive, theme }) => (isActive ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    white-space: nowrap;
    border-bottom: 2px solid
        ${({ isActive, theme }) => (isActive ? theme.TYPE_DARK_GREY : 'transparent')};
    margin-right: 20px;

    :first-child {
        margin-left: 5px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-right: 15px;
    }
`;

const StyledNavLink = styled.div<{ isActive: boolean; isNavigationDisabled: boolean }>`
    padding: 9px 12px;
    cursor: ${({ isActive, isNavigationDisabled }) =>
        isActive || isNavigationDisabled ? 'default' : 'pointer'};
    opacity: ${({ isActive, isNavigationDisabled }) => !isActive && isNavigationDisabled && '.5'};
`;

const InnerWrap = styled.div`
    width: 100%;
    height: ${SECONDARY_PANEL_HEIGHT};
    display: flex;
    place-content: center center;
    padding: 0 16px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
`;

const Text = styled.div`
    position: relative;
`;

export type NavigationItem = {
    id: string;
    callback: () => void;
    title: JSX.Element;
    'data-test'?: string;
    isHidden?: boolean;
};
export type ActionItem = NavigationItem & {
    icon?: IconProps['icon'];
    extra?: boolean;
};

interface AppNavigationProps {
    items: NavigationItem[];
    actions?: ActionItem[];
    primaryContent?: ReactNode;
    inView?: boolean;
}
interface MenuWidths {
    primary: number;
    secondary: number;
    wrapper: number;
}

const isRouteActive = (routeName?: Route['name'], id?: string): boolean => routeName === id;

const isSubsection = (routeName: Route['name']): boolean =>
    routeName.startsWith('wallet') &&
    routeName !== 'wallet-index' &&
    routeName !== 'wallet-details' &&
    routeName !== 'wallet-tokens' &&
    routeName !== 'wallet-staking';

const isSecondaryMenuOverflown = ({ primary, secondary, wrapper }: MenuWidths) =>
    primary + secondary >= wrapper;

export const AppNavigation = ({ items, actions, primaryContent, inView }: AppNavigationProps) => {
    const [condensedSecondaryMenuVisible, setCondensedSecondaryMenuVisible] =
        useState<boolean>(false);
    const wrapper = useRef<HTMLDivElement>(null);
    const primary = useRef<HTMLDivElement>(null);
    const secondary = useRef<HTMLDivElement>(null);

    const routeName = useSelector(state => state.router.route?.name);
    const screenWidth = useSelector(state => state.resize.screenWidth);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    useLayoutEffect(() => {
        if (primary.current && secondary.current && wrapper.current) {
            setCondensedSecondaryMenuVisible(
                isSecondaryMenuOverflown({
                    primary: primary.current.getBoundingClientRect().width,
                    secondary: secondary.current.getBoundingClientRect().width,
                    wrapper: wrapper.current.getBoundingClientRect().width,
                }),
            );
        }
    }, [wrapper, primary, secondary, screenWidth]);

    const visibleItems = items.filter(item => !item.isHidden);
    const visibleActions = actions?.filter(action => !action.isHidden);

    const itemsSecondaryWithExtra = visibleActions?.filter(item => item.extra);

    // a hack before a proper rewrite of the menu
    const buyAction = visibleActions?.find(item => item.id === 'wallet-coinmarket-buy');
    const otherActions = visibleActions?.filter(
        item => !item.extra && item.id !== 'wallet-coinmarket-buy',
    );

    const isAccountLoading = selectedAccount.status === 'loading';
    const isAccountError = selectedAccount.status === 'exception';

    const disabledButtonsDueDiscovery = isAccountLoading || isAccountError;

    return (
        <Wrapper ref={wrapper} inView={inView} subRoute={routeName && isSubsection(routeName)}>
            {routeName && isSubsection(routeName) ? (
                <InnerWrap>
                    <MenuHolder>
                        <AccountStickyContent
                            routeName={routeName}
                            account={selectedAccount.account}
                        />
                        <AccountFormCloseButton />
                    </MenuHolder>
                </InnerWrap>
            ) : (
                <InnerWrap>
                    <KeepWidth>
                        <Primary ref={primary}>
                            {primaryContent ||
                                visibleItems.map(item => {
                                    const { id, title } = item;
                                    const isActive = isRouteActive(routeName, id);
                                    const isHoverable = !isActive && !isAccountLoading;
                                    const onClick = isAccountLoading ? undefined : item.callback;

                                    return (
                                        <MenuElement key={id} isActive={isActive}>
                                            <HoverAnimation isHoverable={isHoverable}>
                                                <AppNavigationTooltip isActiveTab={isActive}>
                                                    <StyledNavLink
                                                        isActive={isActive}
                                                        isNavigationDisabled={isAccountLoading}
                                                        onClick={onClick}
                                                        data-test={item['data-test']}
                                                    >
                                                        <Text>{title}</Text>
                                                    </StyledNavLink>
                                                </AppNavigationTooltip>
                                            </HoverAnimation>
                                        </MenuElement>
                                    );
                                })}
                        </Primary>
                        <Secondary ref={secondary}>
                            {condensedSecondaryMenuVisible && actions && (
                                <AppNavigationTooltip>
                                    <Dropdown
                                        alignMenu="bottom-right"
                                        isDisabled={disabledButtonsDueDiscovery}
                                        items={[
                                            {
                                                key: 'all',
                                                options: actions?.map(item => {
                                                    const { id, title } = item;

                                                    return {
                                                        key: id,
                                                        onClick: () => item.callback(),
                                                        label: title,
                                                    };
                                                }),
                                            },
                                        ]}
                                    />
                                </AppNavigationTooltip>
                            )}
                            <SecondaryMenu visible={!condensedSecondaryMenuVisible}>
                                {buyAction && (
                                    <AppNavigationTooltip>
                                        <Button
                                            icon={buyAction?.icon}
                                            key={buyAction?.id}
                                            onClick={buyAction?.callback}
                                            data-test={`@wallet/menu/${buyAction?.id}`}
                                            variant="tertiary"
                                            size="small"
                                            isDisabled={disabledButtonsDueDiscovery}
                                        >
                                            <Text>{buyAction?.title}</Text>
                                        </Button>
                                    </AppNavigationTooltip>
                                )}

                                {otherActions && (
                                    <AppNavigationTooltip>
                                        <ButtonGroup
                                            size="small"
                                            isDisabled={disabledButtonsDueDiscovery}
                                        >
                                            {otherActions?.map(item => {
                                                const { id, title, icon } = item;

                                                return (
                                                    <Button
                                                        icon={icon}
                                                        key={id}
                                                        onClick={item.callback}
                                                        data-test={`@wallet/menu/${item.id}`}
                                                        variant={
                                                            id === 'wallet-coinmarket-buy'
                                                                ? 'tertiary'
                                                                : 'primary'
                                                        }
                                                    >
                                                        <Text>{title}</Text>
                                                    </Button>
                                                );
                                            })}
                                        </ButtonGroup>
                                    </AppNavigationTooltip>
                                )}
                                {!!itemsSecondaryWithExtra?.length && (
                                    <AppNavigationTooltip>
                                        <Dropdown
                                            alignMenu="bottom-right"
                                            isDisabled={disabledButtonsDueDiscovery}
                                            data-test="@wallet/menu/extra-dropdown"
                                            items={[
                                                {
                                                    key: 'extra',
                                                    options:
                                                        itemsSecondaryWithExtra.map<DropdownMenuItemProps>(
                                                            item => {
                                                                const { id, title } = item;

                                                                return {
                                                                    key: id,
                                                                    onClick:
                                                                        disabledButtonsDueDiscovery
                                                                            ? undefined
                                                                            : item.callback,
                                                                    label: title,
                                                                    'data-test': `@wallet/menu/${item.id}`,
                                                                };
                                                            },
                                                        ),
                                                },
                                            ]}
                                        />
                                    </AppNavigationTooltip>
                                )}
                            </SecondaryMenu>
                        </Secondary>
                    </KeepWidth>
                </InnerWrap>
            )}
        </Wrapper>
    );
};
