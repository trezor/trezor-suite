import * as React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { palette } from '@trezor/theme';

export const CardBackgroundSvg = () => (
    <Svg
        viewBox="0 0 334 238"
        preserveAspectRatio="xMidYMid slice"
        fill={palette.globalWhiteAlpha50}
        style={StyleSheet.absoluteFill}
    >
        <Path d="M334 110.132C302.448 147.219 260.843 196.882 228.136 238H141.043C163.6 203.833 188.72 169.155 210.291 146.084C184.653 166.478 137.96 204.557 99.835 238H2.64844C4.13138 222.94 9.06699 206.598 18.3506 191.322C46.9796 144.214 57.8673 117.32 59.7324 109.761C41.999 130.526 9.88667 170.381 0 190.178V78.6016C23.9384 54.234 52.5697 25.978 80.0439 0H193.393C147.188 70.6294 70.3254 186.484 69.2793 195.027C113.171 145.793 202.556 50.527 263.845 0H334V110.132Z" />
    </Svg>
);
