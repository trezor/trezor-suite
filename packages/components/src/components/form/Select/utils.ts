import { StylesConfig } from 'react-select';

import { CSSObject } from 'styled-components';

import { zIndices } from '@trezor/theme';

export const createSharedMenuStyles = <OptionType>(
    menuPortalZIndex?: number,
): StylesConfig<OptionType, boolean> => ({
    menuPortal: base => ({
        ...(base as Record<string, CSSObject>),
        zIndex: menuPortalZIndex ?? zIndices.selectMenu,
    }),
});
