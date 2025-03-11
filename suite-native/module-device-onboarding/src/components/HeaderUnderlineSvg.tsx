import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

import { useIllustrationColors } from '@suite-native/atoms';

export const HeaderUnderlineSvg = (props: SvgProps) => {
    const { lineColor } = useIllustrationColors();

    return (
        <Svg width={222} height={10} fill="none" {...props}>
            <Path
                fill={lineColor}
                d="M1.995 2.525C53.744-.098 107.902.93 160.472 1.268c18.682.175 37.417 1.564 56.049 3.262l2.801.247.682.06.324.02.126.006c-.111.06.3-.144-.415.159.184 3.4.258 1.022.216 1.75-39.372-4.117-79.695-.91-118.773 2.284-8.64-2.438 79.033-8.419 118.414-4.347.25.043.453.065.775.137.005.744.163-1.63.364 1.815-.77.32-.425.107-.59.171-.138-.005-.462-.019-.599-.037-4.596-.445-10.069-1.018-14.659-1.306-33.506-2.283-67.268-3.043-100.873-2.636-40.776.651-116.234 2.03-102.32-.328Z"
            />
        </Svg>
    );
};
