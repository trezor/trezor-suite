import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectAccountByKey, selectDeviceAccounts } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Banner, CardList, Column, Modal, Text } from '@trezor/components';

import { shareFreshAddressWithContactThunk } from 'src/actions/suite/contactsThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectContactsWallet } from 'src/reducers/suite/contactsReducer';
import { accountSlip44, isContactsAccount } from 'src/utils/contacts/coin';
import {
    type ContactsError,
    getContactsErrorTranslationKey,
} from 'src/utils/contacts/contactsErrors';
import {
    accountShareCapacity,
    getShareableAddresses,
    selectReceiveFlowExclusions,
} from 'src/utils/contacts/sharing';
import { ReceiveAccountItem } from 'src/views/wallet/send/Outputs/ReceiveAddressModal/ReceiveAccountItem';
import { UtxoReceiveAddressList } from 'src/views/wallet/send/Outputs/ReceiveAddressModal/UtxoReceiveAddressList';

type ShareAddressModalProps = {
    /** The contact to give a fresh receive address to. */
    npub: string;
    /** Set when answering a request for one coin: only accounts of that coin are offered. */
    slip44?: number;
    onClose: () => void;
};

/**
 * Picks the address to share: first the account (skipped when only one qualifies), then one of its
 * fresh addresses. Only addresses that the Receive page would still offer, that no contact holds
 * and that lie within the gap limit are listed, so choosing one cannot link two contacts, link a
 * contact to someone paid through the Receive page, or hide funds from recovery. The device then
 * signs the address with the contact identity, and the signed address is published to the contact.
 */
export const ShareAddressModal = ({ npub, slip44, onClose }: ShareAddressModalProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    const deviceAccounts = useSelector(selectDeviceAccounts);
    const wallet = useSelector(state =>
        deviceState ? selectContactsWallet(state, deviceState) : undefined,
    );

    const [error, setError] = useState<ContactsError | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    // Reserved shares expire, so the fresh set depends on the current time. Nothing is memoized on
    // it, so reading it on every render is correct.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const shareableAccounts = useSelector(state =>
        deviceAccounts.filter(
            account =>
                isContactsAccount(account) &&
                (slip44 === undefined || accountSlip44(account) === slip44) &&
                accountShareCapacity({
                    account,
                    wallet: wallet ?? {},
                    now,
                    ...selectReceiveFlowExclusions(state, account),
                }) > 0,
        ),
    );

    // Only the key is kept: the account and its fresh addresses are read live, so an address that
    // receives a payment or is given out on the Receive page while the modal is open drops out.
    const [selectedAccountKey, setSelectedAccountKey] = useState<AccountKey | null>(
        shareableAccounts.length === 1 ? (shareableAccounts[0]?.key ?? null) : null,
    );
    const account = useSelector(state => selectAccountByKey(state, selectedAccountKey));
    const candidates = useSelector(state =>
        account
            ? getShareableAddresses({
                  account,
                  wallet: wallet ?? {},
                  now,
                  ...selectReceiveFlowExclusions(state, account),
              })
            : [],
    );

    const share = async (accountKey: AccountKey, path: string) => {
        if (isSharing) return;

        setError(null);
        setIsSharing(true);

        const result = await dispatch(
            shareFreshAddressWithContactThunk({ npub, accountKey, path }),
        ).unwrap();

        if (!result.success) {
            setError(result.error);
            setIsSharing(false);

            return;
        }

        onClose();
    };

    const errorBanner = error !== null && (
        <Banner
            intent="critical"
            icon
            description={<Translation id={getContactsErrorTranslationKey(error.code)} />}
        />
    );

    // Account step, reached only when more than one account qualifies.
    if (!account) {
        return (
            <Modal heading={<Translation id="TR_CONTACTS_SHARE_ADDRESS" />} onCancel={onClose}>
                <Column gap={12}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_SHARE_PICK_ACCOUNT" />
                    </Text>
                    {errorBanner}
                    <CardList>
                        {shareableAccounts.map(shareableAccount => (
                            <ReceiveAccountItem
                                key={shareableAccount.key}
                                account={shareableAccount}
                                onAccountSelect={selected => setSelectedAccountKey(selected.key)}
                            />
                        ))}
                    </CardList>
                </Column>
            </Modal>
        );
    }

    const handleAddressSelect = (address: string) => {
        const chosenAddress = candidates.find(candidate => candidate.address === address);
        if (chosenAddress) share(account.key, chosenAddress.path);
    };

    return (
        <Modal
            heading={<Translation id="TR_CONTACTS_SHARE_ADDRESS" />}
            onCancel={onClose}
            onBackClick={
                shareableAccounts.length > 1 ? () => setSelectedAccountKey(null) : undefined
            }
        >
            <Column gap={16}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation
                        id={
                            isSharing
                                ? 'TR_CONTACTS_SHARE_CONFIRM_ON_DEVICE'
                                : 'TR_CONTACTS_SHARE_FRESH_HINT'
                        }
                    />
                </Text>
                {errorBanner}
                <UtxoReceiveAddressList
                    account={account}
                    addresses={candidates}
                    onAddressSelect={handleAddressSelect}
                    title={<Translation id="TR_CONTACTS_SHARE_FRESH_ADDRESSES" />}
                />
            </Column>
        </Modal>
    );
};
