import { type MouseEvent } from 'react';
import { useDispatch } from 'react-redux';

import styled, { css } from 'styled-components';

import { type ExtendedMessageDescriptor, Translation, type TranslationKey } from '@suite/intl';
import { type Route, goto, selectRouteName } from '@suite/router';
import {
    Badge,
    Icon,
    type IconComponent,
    Paragraph,
    Row,
    ShortcutBadge,
    type ShortcutBadgeProps,
    StatusBadge,
    TOOLTIP_DELAY_LONG,
    TOOLTIP_DELAY_SHORT,
    Tooltip,
} from '@trezor/components';
import { commonFocusStyles } from '@trezor/components/src/utils/utils';

import { useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

const Container = styled.button<{ $isActive?: boolean }>`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px;
    border-radius: 12px;
    transition: 0.2s ease-in-out;
    cursor: pointer;
    border: 0;
    background: none;
    -webkit-app-region: no-drag;

    &:focus-visible {
        ${commonFocusStyles}
    }

    &:hover {
        background: ${({ theme }) => theme.elementFillGhostHovered};
    }

    ${({ $isActive, theme }) =>
        $isActive &&
        css`
            background: ${theme.elementFillElevated} !important;
            box-shadow: ${theme.elementShadowElevated};
        `}
`;

export type NavigationItemProps = {
    nameId: TranslationKey;
    icon: IconComponent;
    expanded?: boolean;
    routes?: Route['name'][];
    goToRoute?: Route['name'];
    preserveParams?: boolean;
    isActive?: boolean;
    hasIndicator?: boolean;
    hasNewContentIndicator?: boolean;
    isNewContentIndicatorAnimated?: boolean;
    'data-testid'?: string;
    className?: string;
    values?: ExtendedMessageDescriptor['values'];
    onClick?: () => void;
    shortcut?: ShortcutBadgeProps['shortcut'];
};

type TitleProps = {
    nameId: TranslationKey;
    values?: ExtendedMessageDescriptor['values'];
};

const Title = ({ nameId, values }: TitleProps) => <Translation id={nameId} values={values} />;

const NavItem = ({
    nameId,
    icon,
    expanded,
    routes,
    goToRoute,
    isActive,
    hasIndicator,
    hasNewContentIndicator,
    isNewContentIndicatorAnimated,
    'data-testid': dataTest,
    values,
    preserveParams,
    onClick,
    shortcut,
}: NavigationItemProps) => {
    const activeRoute = useSelector(selectRouteName);
    const dispatch = useDispatch();

    const handleClick = (e: MouseEvent) => {
        e.stopPropagation();

        onClick?.();

        if (goToRoute !== undefined) {
            dispatch(
                goto({
                    routeName: goToRoute,
                    ...(preserveParams === true ? { preserveParams } : undefined),
                }),
            );
        }
    };

    const isActiveRoute = routes?.some(route => route === activeRoute);
    const isItemActive = isActive || isActiveRoute;

    const isTooltipActive = expanded ? shortcut !== undefined : true;
    const isNewContentBadgeShown = expanded === true && hasNewContentIndicator === true;
    const isNewContentDotShown =
        expanded !== true && hasNewContentIndicator === true && hasIndicator !== true;
    const isIconIndicatorShown = hasIndicator === true || isNewContentDotShown;
    const iconIndicatorIntent = hasIndicator === true ? 'critical' : 'accentViolet';
    const navigationItemTestId = dataTest || `@suite/menu/${goToRoute}`;

    return (
        <Tooltip
            cursor="pointer"
            flex="1"
            content={
                shortcut ? (
                    <Row gap={12}>
                        <Title nameId={nameId} values={values} />
                        <ShortcutBadge shortcut={shortcut} />
                    </Row>
                ) : (
                    <Title nameId={nameId} values={values} />
                )
            }
            isActive={isTooltipActive}
            delayShow={expanded ? TOOLTIP_DELAY_LONG : TOOLTIP_DELAY_SHORT}
            placement="right"
        >
            <Container
                $isActive={isItemActive}
                onClick={handleClick}
                data-testid={navigationItemTestId}
                type="button"
            >
                <StatusBadge
                    isShown={isIconIndicatorShown}
                    isAnimated={
                        hasIndicator === true
                            ? isIconIndicatorShown
                            : isNewContentDotShown && isNewContentIndicatorAnimated
                    }
                    intent={iconIndicatorIntent}
                    offset={{ x: -6, y: 5 }}
                >
                    <Icon
                        as={icon}
                        size={24}
                        intent="neutral"
                        priority={isItemActive ? 'primary' : 'secondary'}
                        pointerEvents="none"
                    />
                </StatusBadge>
                {expanded && (
                    <Row
                        flex="1"
                        minWidth={0}
                        gap={8}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Paragraph
                            typographyStyle="body-md"
                            intent="neutral"
                            priority={isItemActive ? 'primary' : 'secondary'}
                            minWidth={0}
                            overflowWrap="anywhere"
                        >
                            <Translation id={nameId} values={values} />
                        </Paragraph>
                        {isNewContentBadgeShown && (
                            <Badge
                                size="medium"
                                intent="accentViolet"
                                isAnimated={isNewContentIndicatorAnimated}
                                data-testid={`${navigationItemTestId}/new-content-indicator`}
                            >
                                <Translation id="TR_NEW" />
                            </Badge>
                        )}
                    </Row>
                )}
            </Container>
        </Tooltip>
    );
};

export const NavigationItem = (props: NavigationItemProps) => {
    const { isSidebarCollapsed } = useResponsiveContext();

    return <NavItem expanded={!isSidebarCollapsed} {...props} />;
};
