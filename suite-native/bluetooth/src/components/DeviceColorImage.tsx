import { Image } from '@suite-native/atoms';

const deviceImageMap: Record<number, string> = {
    1: require('../assets/t3w1-color-1.webp'),
    2: require('../assets/t3w1-color-2.webp'),
    3: require('../assets/t3w1-color-3.webp'),
    4: require('../assets/t3w1-color-4.webp'),
};

type DeviceColorImageProps = {
    color: number;
};

export const DeviceColorImage = ({ color }: DeviceColorImageProps) => (
    <Image source={deviceImageMap[color] ?? deviceImageMap[1]} width={66} height={112} />
);
