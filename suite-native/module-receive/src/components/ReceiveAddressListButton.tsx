import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type AccountsRootState, selectIsAccountUtxoBased } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { IconButton } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAddress
>;

type ReceiveAddressListButtonProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveAddressListButton = ({
    accountKey,
    tokenContract,
}: ReceiveAddressListButtonProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { translate } = useTranslate();
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );

    // The receive address list is only relevant for UTXO-based coins
    if (!isAccountUtxoBased || !!tokenContract) {
        return null;
    }

    return (
        <IconButton
            iconName="listBullets"
            intent="neutral"
            priority="secondary"
            size="medium"
            onPress={() =>
                navigation.navigate(ReceiveStackRoutes.ReceiveAddressList, {
                    accountKey,
                })
            }
            accessibilityLabel={translate('moduleReceive.addressList.openButtonAccessibilityLabel')}
            testID="@receive/address-list/open-button"
        />
    );
};
