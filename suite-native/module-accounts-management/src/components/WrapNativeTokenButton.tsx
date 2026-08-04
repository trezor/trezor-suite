import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { getWrappedNativeAddress } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Button } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

type WrapNativeTokenButtonProps = {
    accountKey: AccountKey;
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

/** Dev-only entry to the standalone wrap flow (e.g. ETH → WETH). */
export const WrapNativeTokenButton = ({ accountKey }: WrapNativeTokenButtonProps) => {
    const navigation = useNavigation<NavigationProp>();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (
        !isDevelopOrDebugEnv() ||
        account?.networkType !== 'ethereum' ||
        !getWrappedNativeAddress(account.symbol)
    ) {
        return null;
    }

    const handlePress = () => {
        navigation.navigate(RootStackRoutes.WrappedNativeTokenNavigator, {
            screen: WrappedNativeTokenStackRoutes.WrapNativeToken,
            params: { accountKey },
        });
    };

    return (
        <Box paddingHorizontal="sp16">
            <Button
                intent="neutral"
                priority="secondary"
                onPress={handlePress}
                testID="@account-detail/wrap-native-token-button"
            >
                <Translation id="earn.wrapNativeToken.entryButton" />
            </Button>
        </Box>
    );
};
