import { StylesConfig } from 'react-select';

import { CSSObject, DefaultTheme } from 'styled-components';

import { borders, spacings, spacingsPx, typographyStylesBase, zIndices } from '@trezor/theme';

export const createSharedMenuStyles = <OptionType>(
    theme: DefaultTheme,
): StylesConfig<OptionType, boolean> => ({
    menuPortal: base => ({
        ...(base as Record<string, CSSObject>),
        zIndex: zIndices.selectMenu,
    }),
    menu: base => ({
        ...(base as Record<string, CSSObject>),
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: spacings.sm,
        minWidth: 180,
        borderRadius: borders.radii.md,
        background: theme.backgroundSurfaceElevation1,
        outline: `1px solid ${theme.baseBorderSurfaceAction}`,
        boxShadow: theme.boxShadowElevated,
        listStyleType: 'none',
        overflow: 'hidden',
        transition: 'background 0.3s',
        border: 'none',
        width: 'fit-content',
    }),
    menuList: (base, { maxHeight }) => ({
        ...(base as Record<string, CSSObject>),
        maxHeight,
        overflowY: 'auto',
    }),
    groupHeading: base => ({
        ...(base as Record<string, CSSObject>),
        margin: 0,
        padding: spacings.xs,
        ...{
            ...typographyStylesBase.label,
            lineHeight: `${typographyStylesBase.label.lineHeight}px`,
        },
        textTransform: 'initial',
    }),
    group: base => ({
        ...(base as Record<string, CSSObject>),
        padding: 0,
        '& + &': {
            paddingTop: spacingsPx.xxs,
            marginTop: spacingsPx.xxs,
        },
    }),
    option: (base, { isFocused }) => ({
        ...(base as Record<string, CSSObject>),
        padding: `${spacingsPx.xs} ${spacingsPx.sm}`,
        borderRadius: borders.radii.xxs,
        background: isFocused ? theme.backgroundSurfaceElevation2 : 'transparent',
        color: theme.textDefault,
        ...{
            ...typographyStylesBase.body,
            lineHeight: `${typographyStylesBase.body.lineHeight}px`,
        },
        cursor: 'pointer',
        '&:active': {
            background: theme.backgroundSurfaceElevation0,
        },
    }),
});
