import Svg, { Defs, Path, Use } from 'react-native-svg';

import { useNativeStyles } from '@trezor/styles-native';

export const NetworkExplorerConnectorSvg = () => {
    const { utils } = useNativeStyles();

    return (
        <Svg width={16} height={120} viewBox="0 0 17 121" fill="none" style={{ marginTop: -88 }}>
            <Defs>
                <Path id="path" d="M0.5 0.5V110.5C0.5 116.0228 4.97715 120.5 10.5 120.5H16.5" />
            </Defs>
            <Use
                href="#path"
                stroke={utils.colors.surfaceFillRaised} /* must match the Card fill color */
            />
            <Use
                href="#path"
                stroke={utils.colors.surfaceBorderSunken}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={[2, 4]}
            />
        </Svg>
    );
};
