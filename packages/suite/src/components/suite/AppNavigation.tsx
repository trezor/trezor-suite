import React, { useRef, useLayoutEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import {
    variables,
    IconProps,
    useTheme,
    Button,
    Icon,
    Dropdown,
    HoverAnimation,
} from '@trezor/components';
import { AccountFormCloseButton } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { Route } from '@suite-types';
import { AccountStickyContent } from './AccountStickyContent';
import { MAX_WIDTH, MAX_WIDTH_WALLET_CONTENT } from '@suite-constants/layout';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const SECONDARY_MENU_BUTTON_MARGIN = '12px';
export const SECONDARY_PANEL_HEIGHT = '60px';

const Wrapper = styled.div<{ subRoute: boolean | undefined; inView?: boolean }>`
    width: 100%;
    z-index: ${variables.Z_INDEX.STICKY_BAR};
    display: flex;
    background: ${props => props.theme.BG_LIGHT_GREY};
    justify-content: center;
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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

const MenuHolder = styled.div<{
    maxWidth: string | undefined;
}>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: ${props => (props.maxWidth === 'default' ? MAX_WIDTH : MAX_WIDTH_WALLET_CONTENT)};
    scrollbar-width: none; /* Firefox */
    position: relative;
    border-top: none;
    transition: all 0.3s ease;

    ::-webkit-scrollbar {
        width: 0;
        height: 0;
    }
`;

const KeepWidth = styled.div<{ maxWidth?: string; inView?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${props => props.theme.BG_LIGHT_GREY};
    width: 100%;
    max-width: ${props => (props.maxWidth === 'default' ? MAX_WIDTH : MAX_WIDTH_WALLET_CONTENT)};
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

const MenuElement = styled.div<{ isActive?: boolean }>`
    position: relative;
    height: ${SECONDARY_PANEL_HEIGHT};
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props =>
        props.isActive
            ? props => props.theme.TYPE_DARK_GREY
            : props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    white-space: nowrap;
    border-bottom: 2px solid
        ${props => (props.isActive ? props => props.theme.TYPE_DARK_GREY : 'transparent')};
    margin-right: 20px;

    :first-child {
        margin-left: 5px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-right: 15px;
    }
`;

const StyledNavLink = styled.div<{ isActive?: boolean }>`
    padding: 9px 12px;
    cursor: ${({ isActive }) => !isActive && 'pointer'};
`;

const InnerWrap = styled.div`
    width: 100%;
    height: ${SECONDARY_PANEL_HEIGHT};
    display: flex;
    justify-content: center;
    align-content: center;
    padding: 0 16px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
    background: ${props => props.theme.BG_LIGHT_GREY};
`;

const IconWrapper = styled.div`
    margin-right: 10px;
`;

const Text = styled.div`
    position: relative;
`;

const StyledIcon = styled(Icon)`
    margin-right: 10px;
`;

const RightContent = styled.div``;

const StyledDropdown = styled(Dropdown)`
    background: ${props => props.theme.BG_SECONDARY};
    width: 38px;
    height: 38px;
    border-radius: 8px;
    & > :first-child {
        width: 100%;
        height: 100%;
    }
    &:hover {
        background: ${props => props.theme.BG_SECONDARY_HOVER};
    }
`;

// TODO - maybe add to global styleguide when used elsewhere
const StyledButton = styled(Button)`
    font-size: ${FONT_SIZE.NORMAL};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    padding-left: 20px;
    padding-right: 20px;
`;

export type AppNavigationItem = {
    id: string;
    callback: () => void;
    title: JSX.Element;
    position: 'primary' | 'secondary';
    extra?: boolean;
    icon?: IconProps['icon'];
    'data-test'?: string;
    isHidden?: boolean;
    rightContent?: JSX.Element;
};

interface Props {
    items: AppNavigationItem[];
    primaryContent?: React.ReactNode;
    maxWidth?: 'small' | 'default';
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

export const AppNavigation = ({ items, primaryContent, maxWidth, inView }: Props) => {
    const theme = useTheme();
    const [condensedSecondaryMenuVisible, setCondensedSecondaryMenuVisible] =
        useState<boolean>(false);
    const wrapper = useRef<HTMLDivElement>(null);
    const primary = useRef<HTMLDivElement>(null);
    const secondary = useRef<HTMLDivElement>(null);
    const { routeName, screenWidth } = useSelector(state => ({
        routeName: state.router.route?.name,
        screenWidth: state.resize.screenWidth,
    }));

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

    // Move staking tab from primary location to secondary if condensed dropdown menu is visible.
    // It is ugly, byt it will save precious space and prevent menu overflow on smaller screens
    const stakingIndex = items.findIndex(i => i.id === 'wallet-staking' && !i.isHidden);
    const itemsToHideToDropdown = items[stakingIndex];
    if (itemsToHideToDropdown) {
        if (condensedSecondaryMenuVisible) {
            itemsToHideToDropdown.position = 'secondary';
        } else {
            itemsToHideToDropdown.position = 'primary';
        }
    }

    const visibleItems = items.filter(item => !item.isHidden);

    const itemsPrimary = visibleItems.filter(item => item.position === 'primary');
    const itemsSecondary = visibleItems.filter(item => item.position === 'secondary');
    const itemsSecondaryWithExtra = itemsSecondary.filter(item => item.extra);
    const itemsSecondaryWithoutExtra = itemsSecondary.filter(item => !item.extra);

    const selectedAccount = useSelector(state => state.wallet.selectedAccount.account);

    return (
        <Wrapper ref={wrapper} inView={inView} subRoute={routeName && isSubsection(routeName)}>
            {routeName && isSubsection(routeName) ? (
                <InnerWrap>
                    <MenuHolder maxWidth={maxWidth}>
                        <AccountStickyContent routeName={routeName} account={selectedAccount} />
                        <AccountFormCloseButton />
                    </MenuHolder>
                </InnerWrap>
            ) : (
                <InnerWrap>
                    <KeepWidth inView={inView}>
                        <Primary ref={primary}>
                            {primaryContent ||
                                itemsPrimary.map(item => {
                                    const { id, title } = item;
                                    const isActive = isRouteActive(routeName, id);

                                    return (
                                        <MenuElement key={id} isActive={isActive}>
                                            <HoverAnimation isHoverable={!isActive}>
                                                <StyledNavLink
                                                    isActive={isActive}
                                                    onClick={item.callback}
                                                    data-test={item['data-test']}
                                                >
                                                    {item.icon && (
                                                        <IconWrapper>
                                                            <StyledIcon
                                                                size={18}
                                                                icon={item.icon}
                                                                color={
                                                                    isActive
                                                                        ? theme.TYPE_DARK_GREY
                                                                        : undefined
                                                                }
                                                            />
                                                        </IconWrapper>
                                                    )}

                                                    <Text>{title}</Text>
                                                    <RightContent>{item.rightContent}</RightContent>
                                                </StyledNavLink>
                                            </HoverAnimation>
                                        </MenuElement>
                                    );
                                })}
                        </Primary>
                        <Secondary ref={secondary}>
                            {condensedSecondaryMenuVisible && (
                                <StyledDropdown
                                    alignMenu="right"
                                    offset={8}
                                    items={[
                                        {
                                            key: 'all',
                                            options: itemsSecondary.map(item => {
                                                const { id, title } = item;
                                                return {
                                                    key: id,
                                                    callback: () => {
                                                        item.callback();
                                                        return true;
                                                    },
                                                    label: title,
                                                };
                                            }),
                                        },
                                    ]}
                                />
                            )}
                            <SecondaryMenu visible={!condensedSecondaryMenuVisible}>
                                {itemsSecondaryWithoutExtra.map(item => {
                                    const { id, title } = item;
                                    return (
                                        <StyledButton
                                            key={id}
                                            variant={
                                                id === 'wallet-coinmarket-buy'
                                                    ? 'primary'
                                                    : 'secondary'
                                            }
                                            onClick={item.callback}
                                            {...(item['data-test'] && {
                                                'data-test': item['data-test'],
                                            })}
                                            isDisabled={condensedSecondaryMenuVisible}
                                        >
                                            <Text>{title}</Text>
                                        </StyledButton>
                                    );
                                })}
                                {itemsSecondaryWithExtra.length ? (
                                    <StyledDropdown
                                        alignMenu="right"
                                        offset={5}
                                        data-test="@wallet/menu/extra-dropdown"
                                        items={[
                                            {
                                                key: 'extra',
                                                options: itemsSecondaryWithExtra.map(item => {
                                                    const { id, title } = item;
                                                    return {
                                                        key: id,
                                                        callback: () => {
                                                            item.callback();
                                                            return true;
                                                        },
                                                        label: title,
                                                        'data-test': item['data-test'],
                                                    };
                                                }),
                                            },
                                        ]}
                                    />
                                ) : undefined}
                            </SecondaryMenu>
                        </Secondary>
                    </KeepWidth>
                </InnerWrap>
            )}
        </Wrapper>
    );
};
