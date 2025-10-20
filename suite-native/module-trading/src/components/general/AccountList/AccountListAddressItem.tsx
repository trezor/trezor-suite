import { useSelector } from 'react-redux';

import { WithLabelingState, selectAddressLabel } from '@suite-common/local-first-storage';
import { Text } from '@suite-native/atoms';
import { AccountAddress } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountListBaseItem } from './AccountListBaseItem';
import { ReceiveAccount } from '../../../types/general';

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

    const addressLabel = useSelector((state: WithLabelingState) =>
        selectAddressLabel({
            state,
            address: address?.address,
            deviceStaticSessionId: receiveAccount.account.deviceState,
        }),
    );

    if (!address) {
        return null;
    }

    return (
        <AccountListBaseItem
            receiveAccount={receiveAccount}
            label={<AccountAddress address={addressLabel ?? address.address} form="full" />}
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
