import { type SvgProps } from 'react-native-svg';

import { type CSSColor } from '@trezor/theme';

export type PictogramIconSvgProps = {
    color: CSSColor;
} & Omit<SvgProps, 'color'>;
