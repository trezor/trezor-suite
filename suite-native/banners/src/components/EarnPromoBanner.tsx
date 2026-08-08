import { type ReactNode } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Button, FullAlertBox, HStack, IconButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    EarnStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { setIsEarnBannerClosed } from '../bannerFlagsSlice';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>;

interface EarnPromoBannerProps {
    symbol: NetworkSymbol;
    title: ReactNode;
    description: ReactNode;
}

export const EarnPromoBanner = ({ symbol, title, description }: EarnPromoBannerProps) => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    const onExploreClick = () => {
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.EarnStack,
            params: { screen: EarnStackRoutes.Earn },
        });
    };

    const onCloseClick = () => {
        dispatch(setIsEarnBannerClosed(symbol));
    };

    return (
        <FullAlertBox
            iconName="piggyBank"
            verticalAlignment="center"
            title={title}
            description={description}
            intent="brand"
        >
            <HStack marginTop="sp8">
                <Button intent="brand" size="small" onPress={onExploreClick}>
                    <Translation id="earn.promoStakeBanner.exploreButton" />
                </Button>

                <IconButton
                    intent="brand"
                    priority="secondary"
                    size="small"
                    iconName="x"
                    onPress={onCloseClick}
                />
            </HStack>
        </FullAlertBox>
    );
};
