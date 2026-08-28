import { prepareNativeStyle } from '@trezor/styles-native';

type VideoStyleProps = {
    aspectRatio: number;
};

export const videoContainer = prepareNativeStyle((utils, { aspectRatio }: VideoStyleProps) => ({
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: utils.borders.radii.r20,
    aspectRatio,
}));

export const videoStyle = prepareNativeStyle<VideoStyleProps>((_, { aspectRatio }) => ({
    flex: 1,
    aspectRatio,
}));

export const activityIndicatorStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
}));
