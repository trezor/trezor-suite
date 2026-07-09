import Svg, { Path, type SvgProps } from 'react-native-svg';

import { useNativeStyles } from '@trezor/styles-native';

export const RepresentativeAssetsConnectorSvg = (props: SvgProps) => {
    const { utils } = useNativeStyles();

    return (
        <Svg width={16} height={32} viewBox="0 0 17 33" fill="none" {...props}>
            <Path
                d="M0.5 0.5V22.5C0.5 28.0228 4.97715 32.5 10.5 32.5H16.5"
                stroke={utils.colors.borderNeutral}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={[2, 4]}
            />
        </Svg>
    );
};
