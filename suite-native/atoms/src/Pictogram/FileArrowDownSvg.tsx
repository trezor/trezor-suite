import Svg, { Path } from 'react-native-svg';

import { PictogramIconSvgProps } from './types';

export const FileArrowDownSvg = ({ color }: PictogramIconSvgProps) => (
    <Svg width={20} height={20} viewBox="0 0 32 32" fill="none">
        <Path
            d="M6 4a2 2 0 0 1 2-2h10l8 8v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />

        <Path
            d="M18 2v8h8"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        <Path
            d="M16 12v12m-5-5 5 5 5-5"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);
