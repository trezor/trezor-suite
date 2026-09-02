import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getReceiveAddressToAdd } from '@suite-common/address';
import { selectCurrentFreshAddress } from '@suite-common/receive';
import { useDispatch } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { IconButton } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { addReceiveAddressThunk } from '../receiveThunks';
import {
    type ReceiveAddressListRootState,
    selectIsReceiveAccountUtxoBased,
    selectReceiveAccount,
    selectReceiveAccountLabeledUnusedAddresses,
    selectReceiveAccountPendingAddresses,
    selectReceiveAccountTouchedAddresses,
} from '../selectors';

type ReceiveAddressListGenerateButtonProps = {
    accountKey: AccountKey;
};

export const ReceiveAddressListGenerateButton = ({
    accountKey,
}: ReceiveAddressListGenerateButtonProps) => {
    const { translate } = useTranslate();
    const dispatch = useDispatch();

    const account = useSelector((state: ReceiveAddressListRootState) =>
        selectReceiveAccount(state, accountKey),
    );
    const touchedAddresses = useSelector((state: ReceiveAddressListRootState) =>
        selectReceiveAccountTouchedAddresses(state, accountKey),
    );
    const pendingAddresses = useSelector((state: ReceiveAddressListRootState) =>
        selectReceiveAccountPendingAddresses(state, accountKey),
    );
    const currentFreshAddress = useSelector((state: ReceiveAddressListRootState) =>
        selectCurrentFreshAddress(state, accountKey),
    );
    const labeledUnusedAddresses = useSelector((state: ReceiveAddressListRootState) =>
        selectReceiveAccountLabeledUnusedAddresses(state, accountKey),
    );
    const isAccountUtxoBased = useSelector((state: ReceiveAddressListRootState) =>
        selectIsReceiveAccountUtxoBased(state, accountKey),
    );

    const addressToAdd = useMemo(
        () =>
            account
                ? getReceiveAddressToAdd({
                      account,
                      touchedAddresses,
                      labeledUnusedAddresses,
                      pendingAddresses,
                      currentFreshAddress,
                      isAccountUtxoBased,
                  })
                : undefined,
        [
            account,
            currentFreshAddress,
            isAccountUtxoBased,
            labeledUnusedAddresses,
            pendingAddresses,
            touchedAddresses,
        ],
    );

    const handleAddAddress = useCallback(() => {
        dispatch(addReceiveAddressThunk({ accountKey }));
    }, [accountKey, dispatch]);

    if (!addressToAdd) {
        return null;
    }

    return (
        <IconButton
            iconName="plus"
            intent="neutral"
            priority="secondary"
            size="medium"
            onPress={handleAddAddress}
            accessibilityLabel={translate(
                'moduleReceive.addressList.generateButtonAccessibilityLabel',
            )}
            testID="@receive/address-list/generate-button"
        />
    );
};
