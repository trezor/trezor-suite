import { Fragment, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type SelectAddressLabelsForAccountState,
    selectAddressLabelsForAccount,
} from '@suite/address';
import { Translation } from '@suite/intl';
import {
    type ReceiveRootState,
    selectCurrentFreshAddress,
    selectTouchedAddresses,
} from '@suite-common/receive';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectPendingAccountAddresses,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, Divider, Text } from '@trezor/components';

import { AddressHistoryRow } from './AddressHistoryRow';
import { buildReceiveAddressItems } from './address/buildReceiveAddressItems';
import { type ReceiveAmountComponent } from './receive';

type AddressHistoryRootState = AccountsRootState &
    TransactionsRootState &
    ReceiveRootState &
    SelectAddressLabelsForAccountState;

type AddressHistoryProps = {
    accountKey: AccountKey;
    disabled: boolean;
    verifyingAddressPath?: string;
    AmountComponent: ReceiveAmountComponent;
    onCopied: (path: string) => void;
    onVerify: (path: string) => void;
};

export const AddressHistory = ({
    accountKey,
    disabled,
    verifyingAddressPath,
    AmountComponent,
    onCopied,
    onVerify,
}: AddressHistoryProps) => {
    const account = useSelector((state: AddressHistoryRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const touchedAddresses = useSelector((state: AddressHistoryRootState) =>
        selectTouchedAddresses(state, accountKey),
    );
    const pendingAddresses = useSelector((state: AddressHistoryRootState) =>
        selectPendingAccountAddresses(state, accountKey),
    );
    const currentFreshAddress = useSelector((state: AddressHistoryRootState) =>
        selectCurrentFreshAddress(state, accountKey),
    );

    // Hoisted out of the memo so the dependency is a plain identifier; the React Compiler cannot
    // preserve the memoization when the dependency is an optional member expression.
    const addresses = account?.addresses;
    const accountAddresses = useMemo(
        () =>
            addresses ? addresses.used.concat(addresses.unused).map(({ address }) => address) : [],
        [addresses],
    );

    const addressLabels = useSelector((state: AddressHistoryRootState) =>
        account
            ? selectAddressLabelsForAccount(state, {
                  addresses: accountAddresses,
                  accountKey,
                  deviceStaticId: account.deviceState,
              })
            : {},
    );

    const usedItems = useMemo(
        () =>
            account
                ? buildReceiveAddressItems({
                      account,
                      touchedAddresses,
                      pendingAddresses,
                      addressLabels,
                      currentFreshAddress,
                  })
                : [],
        [account, touchedAddresses, pendingAddresses, addressLabels, currentFreshAddress],
    );

    // With no fresh address left, the newest card shows the most recent used address, so drop it here
    // to avoid listing it twice.
    const items = currentFreshAddress ? usedItems : usedItems.slice(1);

    const isVerifyInProgress = verifyingAddressPath !== undefined;

    if (items.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none">
            <Box padding={{ vertical: 16, horizontal: 24 }}>
                <Text typographyStyle="body-md">
                    <Translation id="RECEIVE_ADDRESS_HISTORY" />
                </Text>
            </Box>

            {items.map((item, index) => {
                const isVerifyLoading = verifyingAddressPath === item.path;

                return (
                    <Fragment key={item.path}>
                        <Divider margin={{ top: 0, bottom: 0 }} />
                        <AddressHistoryRow
                            item={item}
                            index={index}
                            accountKey={accountKey}
                            disabled={disabled}
                            isVerifyLoading={isVerifyLoading}
                            isVerifyDisabled={isVerifyInProgress && !isVerifyLoading}
                            AmountComponent={AmountComponent}
                            onCopied={onCopied}
                            onVerify={onVerify}
                        />
                    </Fragment>
                );
            })}
        </Card>
    );
};
