import { type ComponentProps } from 'react';

import { PressableOpacity } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const itemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp12,
    marginHorizontal: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp20,
}));

type PortfolioAssetsViewOptionsItemProps = Omit<ComponentProps<typeof PressableOpacity>, 'style'>;

export const PortfolioAssetsViewOptionsItem = (props: PortfolioAssetsViewOptionsItemProps) => {
    const { applyStyle } = useNativeStyles();

    return <PressableOpacity style={applyStyle(itemStyle)} {...props} />;
};
