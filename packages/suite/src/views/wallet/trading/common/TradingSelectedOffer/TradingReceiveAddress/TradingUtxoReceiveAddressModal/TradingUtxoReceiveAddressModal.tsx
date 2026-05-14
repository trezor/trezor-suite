import { useMemo, useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { type Address } from '@trezor/blockchain-link-types';
import { Column, Modal } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';

import { TradingReceiveAddressEmpty } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { TradingUtxoReceiveAddressList } from './TradingUtxoReceiveAddressList';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

const MAX_UNUSED_ADDRESSES = 1;

export const TradingUtxoReceiveAddressModal = () => {
    const { tradingReceiveAddress } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();
    const { translationString } = useTranslation();

    const [search, setSearch] = useState('');

    const account = tradingReceiveAddress.selectedAccount;

    const addresses = account?.addresses;

    const [usedAddresses, unusedAddresses] = useMemo(() => {
        const used = addresses?.used ?? [];
        const unused = addresses?.unused?.slice(0, MAX_UNUSED_ADDRESSES) ?? [];
        const query = search.trim();

        const filterPredicate = (address: Address) =>
            address.address.includes(query) || address.path.includes(query);

        const usedFiltered = used.filter(filterPredicate);
        const unusedFiltered = unused.filter(filterPredicate);

        return [usedFiltered, unusedFiltered];
    }, [addresses, search]);

    if (!account) return null;

    const noResults = usedAddresses.length === 0 && unusedAddresses.length === 0;

    const onCancel = () => {
        modalControls.close();
    };

    const onBackClick = () => {
        onCancel();
        modalControls.open('accountModal');
    };

    return (
        <Modal
            data-testid="@trading/bitcoin-receive-address-modal"
            heading={<Translation id="TR_BUY_RECEIVING_ADDRESS" />}
            onCancel={onCancel}
            onBackClick={onBackClick}
            width={600}
        >
            <Column gap={24}>
                <SearchAsset
                    searchPlaceholder={translationString('TR_SEARCH')}
                    search={search}
                    setSearch={setSearch}
                />

                {noResults ? (
                    <TradingReceiveAddressEmpty
                        title={<Translation id="TR_TRADING_RECEIVE_ADDRESS_NOT_FOUND_TITLE" />}
                        text={<Translation id="TR_TRADING_RECEIVE_ADDRESS_NOT_FOUND_TEXT" />}
                    />
                ) : (
                    <>
                        <TradingUtxoReceiveAddressList
                            account={account}
                            addresses={unusedAddresses}
                            title={<Translation id="TR_TRADING_RECEIVE_ADDRESS_NEW_ADDRESS" />}
                        />

                        <TradingUtxoReceiveAddressList
                            account={account}
                            addresses={usedAddresses}
                            title={<Translation id="TR_TRADING_RECEIVE_ADDRESS_USED_ADDRESSES" />}
                        />
                    </>
                )}
            </Column>
        </Modal>
    );
};
