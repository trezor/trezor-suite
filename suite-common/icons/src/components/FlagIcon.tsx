import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { flagIcons } from '../icons';
import { FlagIconProps, flagIconSizes } from '../config';

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
