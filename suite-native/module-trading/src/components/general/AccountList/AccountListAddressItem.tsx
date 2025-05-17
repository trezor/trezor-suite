import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAccount } from '../../../types';
import { AccountAddress } from '../AccountAddress';
import { AccountListBaseItem } from './AccountListBaseItem';

const labelTextStyle = prepareNativeStyle(utils => ({
    color: utils.colors.textSubdued,
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

    if (!address) {
        return null;
    }

    return (
        <AccountListBaseItem
            receiveAccount={receiveAccount}
            label={<AccountAddress address={address.address} form="full" />}
            isAddressDetail={true}
            info={
                <Text variant="hint" style={applyStyle(labelTextStyle)}>
                    {address.path}
                </Text>
            }
            onPress={onPress}
        />
    );
};
