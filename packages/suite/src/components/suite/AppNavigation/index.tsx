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
import { useInViewProp } from '../AppNavigationPanel';
import { useSelector } from '@suite-hooks';
import { Route } from '@suite-types';
import AccountStickyContent from '../AccountStickyContent';
import { MAX_WIDTH, MAX_WIDTH_WALLET_CONTENT } from '@suite-constants/layout';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const SECONDARY_MENU_BUTTON_MARGIN = '12px';

const Wrapper = styled.div<{ value: boolean; subRoute: boolean | undefined }>`
    width: 100%;
    z-index: 3;
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
        props.subRoute &&
        props.value &&
        css`
            transform: translate(0, -71px);
        `}

    ${props =>
        props.subRoute &&
        !props.value &&
        css`
            transition: all 0.3s ease 0s;
            transform: translate(0, 0);
            z-index: 5;
        `}

    ${props =>
        !props.subRoute &&
        props.value &&
        css`
            transform: translate(0px, -71px);
            margin-top: 71px;
            height: 0px;
        `}

    ${props =>
        !props.subRoute &&
        !props.value &&
        css`
            transition: all 0.3s ease 0s;
            transform: translate(0, 0);
            margin-bottom: 70px;
            z-index: 5;
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
    height: 68px;
    scrollbar-width: none; /* Firefox */
    position: relative;
    border-top: none;
    transition: all 0.3s ease;

    &::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }
`;

const KeepWidth = styled.div<{ maxWidth?: string; border: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${props => props.theme.BG_LIGHT_GREY};
    width: 100%;
    max-width: ${props => (props.maxWidth === 'default' ? MAX_WIDTH : MAX_WIDTH_WALLET_CONTENT)};
    ${props => !props.border && `border-top: 1px solid ${props.theme.STROKE_GREY};`}
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

const SecondaryMenuCondensed = styled.div`
    position: absolute;
    top: 1px;
    right: 24px;
    z-index: 3;
    background: ${props => props.theme.BG_WHITE};
    background: linear-gradient(
        90deg,
        transparent 0%,
        ${props => props.theme.BG_WHITE} 10%,
        ${props => props.theme.BG_WHITE} 100%
    );
    height: 68px;
    width: 62px;
    margin: 0 -33px 0;
    padding: 20px 25px 0 13px;
`;

const StyledNavLink = styled.div<{ active?: boolean }>`
    cursor: pointer;
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props =>
        props.active ? props => props.theme.TYPE_DARK_GREY : props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding: 23px 0;
    white-space: nowrap;
    border-bottom: 2px solid
        ${props => (props.active ? props => props.theme.TYPE_DARK_GREY : 'transparent')};
    margin-right: 40px;

    &:first-child {
        margin-left: 5px;
    }
    &:last-child {
        margin-right: ${SECONDARY_MENU_BUTTON_MARGIN};
        margin-left: 10px;
    }
    position: relative;
`;

const InnerWrap = styled.div`
    width: 100%;
    height: 71px;
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

const StyledDropdown = styled(Dropdown)`
    background: ${props => props.theme.BG_GREY};
    width: 38px;
    height: 38px;
    border-radius: 4px;
    & > * {
        width: 100%;
        height: 100%;
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
    isHidden?: () => boolean;
};

interface Props {
    items: AppNavigationItem[];
    primaryContent?: React.ReactNode;
    maxWidth?: 'small' | 'default';
}
interface MenuWidths {
    primary: number;
    secondary: number;
    wrapper: number;
}

const isRouteActive = (routeName?: Route['name'], id?: string): boolean => routeName === id;

const isSubsection = (routeName: Route['name']): boolean =>
    !(
        routeName.startsWith('settings') ||
        routeName === 'wallet-index' ||
        routeName === 'wallet-details' ||
        routeName === 'wallet-tokens'
    );

const isSecondaryMenuOverflown = ({ primary, secondary, wrapper }: MenuWidths) =>
    primary + secondary >= wrapper;

const AppNavigation = ({ items, primaryContent, maxWidth }: Props) => {
    const theme = useTheme();
    const [condensedSecondaryMenuVisible, setCondensedSecondaryMenuVisible] = useState<boolean>(
        false,
    );
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

    const itemsPrimary = items.filter(item => item.position === 'primary');
    const itemsSecondary = items.filter(item => item.position === 'secondary');
    const itemsSecondaryWithExtra = itemsSecondary.filter(item => item.extra);
    const itemsSecondaryWithoutExtra = itemsSecondary.filter(item => !item.extra);

    const sticky = useInViewProp();
    const selectedAccount = useSelector(state => state.wallet.selectedAccount.account);

    return (
        <Wrapper ref={wrapper} value={sticky} subRoute={routeName && isSubsection(routeName)}>
            {routeName && isSubsection(routeName) ? (
                <InnerWrap>
                    <MenuHolder maxWidth={maxWidth}>
                        <AccountStickyContent routeName={routeName} account={selectedAccount} />
                        <AccountFormCloseButton />
                    </MenuHolder>
                </InnerWrap>
            ) : (
                <InnerWrap>
                    <KeepWidth border={!sticky}>
                        <Primary ref={primary}>
                            {primaryContent ||
                                itemsPrimary.map(item => {
                                    const { id, title } = item;
                                    const active = isRouteActive(routeName, id);
                                    return (
                                        <StyledNavLink
                                            key={id}
                                            active={active}
                                            onClick={item.callback}
                                            {...(item['data-test'] && {
                                                'data-test': item['data-test'],
                                            })}
                                        >
                                            <HoverAnimation>
                                                {item.icon && (
                                                    <IconWrapper>
                                                        <StyledIcon
                                                            size={18}
                                                            icon={item.icon}
                                                            color={
                                                                active
                                                                    ? theme.TYPE_DARK_GREY
                                                                    : undefined
                                                            }
                                                        />
                                                    </IconWrapper>
                                                )}

                                                <Text>{title}</Text>
                                            </HoverAnimation>
                                        </StyledNavLink>
                                    );
                                })}
                        </Primary>
                        <Secondary ref={secondary}>
                            {condensedSecondaryMenuVisible && (
                                <SecondaryMenuCondensed>
                                    <Dropdown
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
                                </SecondaryMenuCondensed>
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

export default AppNavigation;
