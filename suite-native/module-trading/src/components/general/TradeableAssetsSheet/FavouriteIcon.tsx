import { Pressable } from 'react-native';

import { Box } from '@suite-native/atoms';
import { Icon, IconProps } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';

export type FavouriteIconProps = {
    isFavourite: boolean;
    onPress: () => void;
};

const getIconProps = (isFavourite: boolean): IconProps =>
    isFavourite
        ? { name: 'starFilled', color: 'backgroundAlertYellowBold' }
        : { name: 'star', color: 'textSubdued' };

const useA11yButtonHint = (isFavourite: boolean): string => {
    const { translate } = useTranslate();

    return isFavourite
        ? translate('moduleTrading.tradeableAssetsSheet.favouritesRemove')
        : translate('moduleTrading.tradeableAssetsSheet.favouritesAdd');
};

export const FavouriteIcon = ({ isFavourite, onPress }: FavouriteIconProps) => {
    const buttonA11yHint = useA11yButtonHint(isFavourite);

    const iconProps = getIconProps(isFavourite);

    return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityHint={buttonA11yHint}>
            <Box padding="sp8">
                <Icon {...iconProps} />
            </Box>
        </Pressable>
    );
};
