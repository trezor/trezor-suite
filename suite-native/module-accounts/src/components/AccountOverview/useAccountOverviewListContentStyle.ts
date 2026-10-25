import { useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { useIsBottomInsetApplicable } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const listContentStyle = prepareNativeStyle<{ bottomInset: number }>(
    ({ spacings }, { bottomInset }) => ({
        paddingBottom: bottomInset + spacings.sp16,
    }),
);

export const useAccountOverviewListContentStyle = () => {
    const { bottom } = useBannerAwareSafeAreaInsets();
    const isBottomInsetApplicable = useIsBottomInsetApplicable();
    const { applyStyle } = useNativeStyles();

    return applyStyle(listContentStyle, {
        bottomInset: isBottomInsetApplicable ? bottom : 0,
    });
};
