import { PressableOpacity } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EarnPromoItem } from '../types';
import { EarnItemOverviewSection } from './EarnItemOverviewSection';

const promoItemStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    minHeight: 70,
}));

type EarnListItemProps = EarnPromoItem & {
    onPress: (item: EarnPromoItem) => void;
};

export const EarnListItem = ({ onPress, ...item }: EarnListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const handlePress = () => {
        onPress(item);
    };

    return (
        <PressableOpacity style={applyStyle(promoItemStyle)} onPress={handlePress}>
            <EarnItemOverviewSection {...item} />
        </PressableOpacity>
    );
};
