import { useMemo, useState } from 'react';

import { useTranslation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { type Address as AddressType } from '@trezor/blockchain-link-types';
import { Column, Modal, Text } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';

import { UtxoReceiveAddressList } from './UtxoReceiveAddressList';

const MAX_UNUSED_ADDRESSES = 1;

interface UtxoReceiveAddressModalProps {
    account: Account;
    onAddressSelect: (address: string) => void;
    onCancel: () => void;
    onBackClick: () => void;
}

export const UtxoReceiveAddressModal = ({
    account,
    onAddressSelect,
    onCancel,
    onBackClick,
}: UtxoReceiveAddressModalProps) => {
    const { translationString } = useTranslation();

    const [search, setSearch] = useState('');

    const { addresses } = account;

    const [usedAddresses, unusedAddresses] = useMemo(() => {
        const used = addresses?.used ?? [];
        const unused = addresses?.unused?.slice(0, MAX_UNUSED_ADDRESSES) ?? [];
        const query = search.trim();

        const filterPredicate = (address: AddressType) =>
            address.address.includes(query) || address.path.includes(query);

        const usedFiltered = used.filter(filterPredicate);
        const unusedFiltered = unused.filter(filterPredicate);

        return [usedFiltered, unusedFiltered];
    }, [addresses, search]);

    const noResults = usedAddresses.length === 0 && unusedAddresses.length === 0;

    return (
        <Modal heading="Receive address" onCancel={onCancel} onBackClick={onBackClick} width={600}>
            <Column gap={24}>
                <SearchAsset
                    searchPlaceholder={translationString('TR_SEARCH')}
                    search={search}
                    setSearch={setSearch}
                />

                {noResults ? (
                    <Column alignItems="center" gap={4} padding={{ vertical: 16 }}>
                        <Text typographyStyle="body-md">Address not found</Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Check the address or browse the list to select an option.
                        </Text>
                    </Column>
                ) : (
                    <>
                        <UtxoReceiveAddressList
                            account={account}
                            addresses={unusedAddresses}
                            onAddressSelect={onAddressSelect}
                            title="New addresses"
                        />

                        <UtxoReceiveAddressList
                            account={account}
                            addresses={usedAddresses}
                            onAddressSelect={onAddressSelect}
                            title="Used addresses"
                        />
                    </>
                )}
            </Column>
        </Modal>
    );
};
