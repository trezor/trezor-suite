import { useSelector } from 'react-redux';

import { type SuiteSyncDataRootState, selectSuiteSyncAddressLabel } from '@suite-common/suite-sync';
import { Text } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AccountListBaseItem } from './AccountListBaseItem';

const labelTextStyle = prepareNativeStyle(utils => ({
    color: utils.colors.contentSecondary,
    flex: 1,
}));

export type AccountListAddressItemProps = {
    receiveAccount: ReceiveAccount;
    onPress: () => void;
};

export const AccountListAddressItem = ({
    receiveAccount,
    onPress,
}: AccountListAddressItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { address } = receiveAccount;

    const addressLabel = useSelector((state: SuiteSyncDataRootState) =>
        address
            ? selectSuiteSyncAddressLabel(
                  state,
                  receiveAccount.account.deviceState,
                  address.address,
              )
            : null,
    );

    if (!address) {
        return null;
    }

    return (
        <AccountListBaseItem
            receiveAccount={receiveAccount}
            label={addressLabel ?? <AddressFormatter value={address.address} format="full" />}
            isAddressDetail={true}
            info={
                <Text variant="body-sm" style={applyStyle(labelTextStyle)}>
                    {address.path}
                </Text>
            }
            onPress={onPress}
        />
    );
};
