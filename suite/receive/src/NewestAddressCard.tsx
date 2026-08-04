import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type SelectAddressLabelState,
    type SelectAddressLabelsForAccountState,
    type SelectLabeledUnusedAddressesState,
    selectAddressLabel,
    selectAddressLabelsForAccount,
    selectLabeledUnusedAddresses,
} from '@suite/address';
import { Translation } from '@suite/intl';
import { getReceiveAddressForFlowEntry, getReceiveAddressToAdd } from '@suite-common/address';
import {
    type ReceiveRootState,
    receiveActions,
    selectCurrentFreshAddress,
    selectTouchedAddresses,
} from '@suite-common/receive';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectIsAccountUtxoBased,
    selectPendingAccountAddresses,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, Divider, IconButton, Row, Text, Tooltip } from '@trezor/components';
import { getAddressPathIndex } from '@trezor/crypto-utils';
import { PlusIcon } from '@trezor/icons';

import { AddressCardDetail } from './AddressCardDetail';
import {
    type ReceiveAddressItem,
    buildReceiveAddressItems,
} from './address/buildReceiveAddressItems';
import { revealNextAddressThunk } from './address/revealNextAddressThunk';

type NewestAddressCardRootState = AccountsRootState &
    TransactionsRootState &
    ReceiveRootState &
    SelectAddressLabelsForAccountState &
    SelectAddressLabelState &
    SelectLabeledUnusedAddressesState;

type NewestAddressCardProps = {
    accountKey: AccountKey;
    disabled: boolean;
    verifyingAddressPath?: string;
    onCopied: (path: string) => void;
    onVerify: (path: string) => void;
};

export const NewestAddressCard = ({
    accountKey,
    disabled,
    verifyingAddressPath,
    onCopied,
    onVerify,
}: NewestAddressCardProps) => {
    const dispatch = useDispatch();

    const account = useSelector((state: NewestAddressCardRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isUtxo = useSelector((state: NewestAddressCardRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );
    const currentFreshAddress = useSelector((state: NewestAddressCardRootState) =>
        selectCurrentFreshAddress(state, accountKey),
    );
    const touchedAddresses = useSelector((state: NewestAddressCardRootState) =>
        selectTouchedAddresses(state, accountKey),
    );
    const pendingAddresses = useSelector((state: NewestAddressCardRootState) =>
        selectPendingAccountAddresses(state, accountKey),
    );
    const labeledUnusedAddresses = useSelector((state: NewestAddressCardRootState) =>
        account ? selectLabeledUnusedAddresses(state, account) : [],
    );
    const currentFreshAddressLabel = useSelector((state: NewestAddressCardRootState) =>
        currentFreshAddress?.address && account
            ? selectAddressLabel(state, {
                  address: currentFreshAddress.address,
                  deviceStaticId: account.deviceState,
              })
            : undefined,
    );

    // Hoisted out of the memo so the dependency is a plain identifier; the React Compiler cannot
    // preserve the memoization when the dependency is an optional member expression.
    const addresses = account?.addresses;
    const accountAddresses = useMemo(
        () =>
            addresses ? addresses.used.concat(addresses.unused).map(({ address }) => address) : [],
        [addresses],
    );
    const addressLabels = useSelector((state: NewestAddressCardRootState) =>
        account
            ? selectAddressLabelsForAccount(state, {
                  addresses: accountAddresses,
                  accountKey,
                  deviceStaticId: account.deviceState,
              })
            : {},
    );

    useEffect(() => {
        if (!account) return;

        dispatch(
            receiveActions.setCurrentFreshAddress({
                accountKey,
                currentFreshAddress: getReceiveAddressForFlowEntry({
                    account,
                    touchedAddresses,
                    labeledUnusedAddresses,
                    pendingAddresses,
                    isAccountUtxoBased: isUtxo,
                }),
            }),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountKey, dispatch]);

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

    const addressToAdd = useMemo(
        () =>
            account
                ? getReceiveAddressToAdd({
                      account,
                      touchedAddresses,
                      labeledUnusedAddresses,
                      pendingAddresses,
                      currentFreshAddress,
                      isAccountUtxoBased: isUtxo,
                  })
                : undefined,
        [
            account,
            touchedAddresses,
            labeledUnusedAddresses,
            pendingAddresses,
            currentFreshAddress,
            isUtxo,
        ],
    );

    const freshItem: ReceiveAddressItem | undefined = currentFreshAddress
        ? {
              path: currentFreshAddress.path,
              address: currentFreshAddress.address,
              pathIndex: getAddressPathIndex(currentFreshAddress.path),
              label: currentFreshAddressLabel ?? undefined,
              isFresh: true,
          }
        : undefined;
    const item = freshItem ?? usedItems[0];

    if (!item) {
        return null;
    }

    const isVerifyLoading = verifyingAddressPath === item.path;
    const isVerifyDisabled = verifyingAddressPath !== undefined && !isVerifyLoading;

    const isCoinjoinRevealDisallowed =
        account?.accountType === 'coinjoin' &&
        !account.addresses?.used.length &&
        currentFreshAddress?.address !== account.addresses?.unused[0]?.address;

    const getRevealDisabledReason = () => {
        if (isCoinjoinRevealDisallowed) {
            return <Translation id="RECEIVE_ADDRESS_COINJOIN_DISALLOW" />;
        }
        if (!addressToAdd) {
            return <Translation id="RECEIVE_UNUSED_ADDRESS_LIMIT_REACHED" />;
        }

        return null;
    };

    const revealDisabledReason = getRevealDisabledReason();
    const isRevealDisabled = revealDisabledReason !== null;

    return (
        <Card paddingType="none">
            {isUtxo && (
                <>
                    <Box padding={{ vertical: 16, horizontal: 24 }}>
                        <Row justifyContent="space-between" alignItems="center">
                            <Text typographyStyle="body-md">
                                <Translation id="RECEIVE_NEWEST_ADDRESS" />
                            </Text>
                            <Tooltip content={revealDisabledReason} isActive={isRevealDisabled}>
                                <IconButton
                                    size="medium"
                                    intent="neutral"
                                    priority="secondary"
                                    icon={PlusIcon}
                                    isDisabled={isRevealDisabled}
                                    tooltip={{
                                        content: <Translation id="RECEIVE_SHOW_NEXT" />,
                                        isActive: !isRevealDisabled,
                                    }}
                                    data-testid="@wallet/receive/show-next-address-button"
                                    onClick={() => dispatch(revealNextAddressThunk({ accountKey }))}
                                />
                            </Tooltip>
                        </Row>
                    </Box>
                    <Divider margin={{ top: 0, bottom: 0 }} />
                </>
            )}
            <AddressCardDetail
                item={item}
                accountKey={accountKey}
                disabled={disabled}
                isVerifyLoading={isVerifyLoading}
                isVerifyDisabled={isVerifyDisabled}
                onCopied={onCopied}
                onVerify={onVerify}
            />
        </Card>
    );
};
