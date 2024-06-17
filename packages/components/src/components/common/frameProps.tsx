import { css } from 'styled-components';
import { TransientProps } from '../../utils/transientProps';
import { SpacingValues } from '@trezor/theme';

type Margin = {
    top?: SpacingValues;
    bottom?: SpacingValues;
    left?: SpacingValues;
    right?: SpacingValues;
};

export type FrameProps = {
    margin?: Margin;
    maxWidth?: string;
};

export type TransientFrameProps = TransientProps<FrameProps>;

export const withFrameProps = ({ $margin, $maxWidth }: TransientFrameProps) => {
    return css`
        ${$margin &&
        css`
            ${$margin.top ? `margin-top: ${$margin.top}px;` : ''}
            ${$margin.bottom ? `margin-bottom: ${$margin.bottom}px;` : ''}
            ${$margin.left ? `margin-left: ${$margin.left}px;` : ''}
            ${$margin.right ? `margin-right: ${$margin.right}px;` : ''}
        `}

        ${$maxWidth &&
        css`
            max-width: ${$maxWidth};
        `};
    `;
};

export const framePropsStory = {
    args: {
        margin: { top: undefined, right: undefined, bottom: undefined, left: undefined },
    },
    argTypes: {
        margin: {
            table: {
                category: 'Frame props',
            },
        },
    },
};
