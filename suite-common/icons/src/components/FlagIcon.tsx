import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { FlagIconName, flagIcons } from '../icons';

type FlagIconProps = {
    name: FlagIconName;
    size?: FlagIconSize;
};

const flagIconSizes = {
    xs: 16,
    s: 24,
    medium: 30,
} as const;

type FlagIconSize = keyof typeof flagIconSizes;

export const FlagIcon = ({ name, size = 'medium' }: FlagIconProps) => {
    const svg = useSVG(flagIcons[name]);
    const sizeNumber = flagIconSizes[size];
    return (
        <Canvas
            style={{
                height: sizeNumber,
                width: sizeNumber,
            }}
        >
            {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
        </Canvas>
    );
};
