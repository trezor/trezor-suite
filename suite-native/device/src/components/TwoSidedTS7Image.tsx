import { Image } from '@suite-native/atoms';

type TwoSidedTS7ImageProps = {
    size: number;
};

export const TwoSidedTS7Image = ({ size }: TwoSidedTS7ImageProps) => (
    <Image
        source={require('../assets/twosidedTS7Model.webp')}
        contentFit="contain"
        width={size}
        height={size}
    />
);
