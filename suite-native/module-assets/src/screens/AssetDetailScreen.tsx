import { type RouteProp, useRoute } from '@react-navigation/native';

import { AssetTransactionList } from '@suite-native/assets';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    Screen,
} from '@suite-native/navigation';

import { AssetDetailActions } from '../components/AssetDetailActions';
import { AssetDetailHeader } from '../components/AssetDetailHeader';
import { AssetDetailScreenHeader } from '../components/AssetDetailScreenHeader';

export const AssetDetailScreen = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;

    return (
        <Screen
            header={<AssetDetailScreenHeader />}
            isScrollable={false}
            noHorizontalPadding
            footer={<AssetDetailActions />}
        >
            <AssetTransactionList
                networkSymbol={networkSymbol}
                tokenContract={tokenContract}
                listHeaderComponent={<AssetDetailHeader />}
            />
        </Screen>
    );
};
