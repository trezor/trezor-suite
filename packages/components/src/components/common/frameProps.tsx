import { Spacing, Spacings } from '@trezor/theme';
import { css } from 'styled-components';
import { TransientProps } from '../../utils/transientProps';

type SpacingValues = Spacings[Spacing];

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
