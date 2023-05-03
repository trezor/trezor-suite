import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { AddressQRCode } from '@suite-native/qr-code';
import { Card, ButtonBackgroundElevation } from '@suite-native/atoms';
import {
    TransactionsRootState,
    AccountsRootState,
    selectAccountByKey,
    selectPendingAccountAddresses,
    selectIsAccountUtxoBased,
} from '@suite-common/wallet-core';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';

type ReceiveAddressProps = {
    accountKey: string;
    onClose: () => void;
    backgroundElevation?: ButtonBackgroundElevation;
};

export const ReceiveAddress = ({
    accountKey,
    onClose,
    backgroundElevation = '0',
}: ReceiveAddressProps) => {
    const [freshAddressError, setFreshAddressError] = useState();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const pendingAddresses = useSelector((state: TransactionsRootState) =>
        selectPendingAccountAddresses(state, accountKey),
    );
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );

    const freshAddress = useMemo(() => {
        if (account && pendingAddresses) {
            // Pass receive addresses empty. We proceed without address verification - not possible in watch only mode.
            try {
                return getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased);
            } catch (err) {
                setFreshAddressError(err.message);
            }
        }
    }, [account, pendingAddresses, isAccountUtxoBased]);

    const handleClose = () => {
        if (freshAddress) {
            onClose();
        }
    };

    return (
        <Card>
            {!freshAddressError ? (
                <AddressQRCode
                    data={freshAddress?.address}
                    onCopy={handleClose}
                    isShareEnabled
                    backgroundElevation={backgroundElevation}
                />
            ) : (
                'Something went wrong...'
            )}
        </Card>
    );
};
