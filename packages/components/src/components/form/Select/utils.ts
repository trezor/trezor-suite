import { type StylesConfig } from 'react-select';

import { type CSSObject } from 'styled-components';

import { zIndices } from '@trezor/theme';

import { type SelectMenuAlign } from './types';

type CreateSharedMenuStylesParams = {
    menuPortalZIndex?: number;
    menuAlign?: SelectMenuAlign;
};

export const createSharedMenuStyles = <OptionType>({
    menuPortalZIndex,
    menuAlign = 'start',
}: CreateSharedMenuStylesParams = {}): StylesConfig<OptionType, boolean> => ({
    menuPortal: base => ({
        ...(base as Record<string, CSSObject>),
        zIndex: menuPortalZIndex ?? zIndices.selectMenu,
    }),
    menu: base => ({
        ...base,
        ...(menuAlign === 'end' && {
            right: 0,
            width: 'max-content',
        }),
    }),
});
