import { type MouseEvent } from 'react';

import styled, { css } from 'styled-components';

import { type ExtendedMessageDescriptor, Translation, type TranslationKey } from '@suite/intl';
import { type Route, goto, selectRouteName } from '@suite/router';
import {
    Icon,
    type IconName,
    Paragraph,
    Row,
    ShortcutBadge,
    type ShortcutBadgeProps,
    TOOLTIP_DELAY_LONG,
    TOOLTIP_DELAY_SHORT,
    Tooltip,
} from '@trezor/components';
import { commonFocusStyles } from '@trezor/components/src/utils/utils';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

const Container = styled.button<{ $isActive?: boolean }>`
    flex: 1;
    display: flex;
    align-items: center;
    gap: ${spacingsPx.md};
    padding: ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
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
    icon: IconName;
    expanded?: boolean;
    routes?: Route['name'][];
    goToRoute?: Route['name'];
    preserveParams?: boolean;
    isActive?: boolean;
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

    return (
        <Tooltip
            cursor="pointer"
            flex="1"
            content={
                shortcut ? (
                    <Row gap={spacings.sm}>
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
                data-testid={dataTest || `@suite/menu/${goToRoute}`}
                type="button"
            >
                <Icon
                    name={icon}
                    size={24}
                    intent="neutral"
                    priority={isItemActive ? 'primary' : 'secondary'}
                    pointerEvents="none"
                />
                {expanded && (
                    <Paragraph
                        typographyStyle="body-md"
                        intent="neutral"
                        priority={isItemActive ? 'primary' : 'secondary'}
                    >
                        <Translation id={nameId} values={values} />
                    </Paragraph>
                )}
            </Container>
        </Tooltip>
    );
};

export const NavigationItem = (props: NavigationItemProps) => {
    const { isSidebarCollapsed } = useResponsiveContext();

    return <NavItem expanded={!isSidebarCollapsed} {...props} />;
};
