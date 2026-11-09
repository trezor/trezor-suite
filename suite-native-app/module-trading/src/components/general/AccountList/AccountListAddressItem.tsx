import { AddressLabel } from '@suite-native/address';
import { AddressFormatter } from '@suite-native/formatters';
import { type ReceiveAccount } from '@suite-native/trading-types';

import { AccountListBaseItem } from './AccountListBaseItem';

export type AccountListAddressItemProps = {
    receiveAccount: ReceiveAccount;
    isFreshAddress: boolean;
    onPress: () => void;
};

export const AccountListAddressItem = ({
    receiveAccount,
    isFreshAddress,
    onPress,
}: AccountListAddressItemProps) => {
    const { address } = receiveAccount;

    if (!address) {
        return null;
    }

    return (
        <AccountListBaseItem
            receiveAccount={receiveAccount}
            label={
                <AddressLabel
                    address={address.address}
                    deviceStaticSessionId={receiveAccount.account.deviceState}
                    fallback={<AddressFormatter value={address.address} format="long" />}
                    numberOfLines={1}
                />
            }
            isAddressDetail={true}
            isFreshAddress={isFreshAddress}
            onPress={onPress}
        />
    );
};
