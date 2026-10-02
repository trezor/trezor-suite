import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';

type AssetDetailRouteProps = RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>;

export const useAssetDetailRouteParams = () => useRoute<AssetDetailRouteProps>().params;
