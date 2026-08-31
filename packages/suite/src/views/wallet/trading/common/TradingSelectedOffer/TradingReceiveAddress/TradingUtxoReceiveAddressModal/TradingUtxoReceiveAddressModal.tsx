import { useMemo, useState } from 'react';

import { selectAddressLabelsForAccount } from '@suite/address';
import { Translation, useTranslation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { normalizeForSearch } from '@suite-common/suite-utils';
import { type Address } from '@trezor/blockchain-link-types';
import { Column, Modal } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';

import { TradingReceiveAddressEmpty } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { TradingUtxoReceiveAddressList } from './TradingUtxoReceiveAddressList';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

const MAX_UNUSED_ADDRESSES = 1;
const EMPTY_ADDRESS_LABELS: Record<string, string | null> = {};

export const TradingUtxoReceiveAddressModal = () => {
    const { tradingReceiveAddress } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();
    const { translationString } = useTranslation();

    const [search, setSearch] = useState('');

    const account = tradingReceiveAddress.selectedAccount;

    const addresses = account?.addresses;

    const accountAddresses = useMemo(
        () =>
            addresses
                ? addresses.used
                      .concat(addresses.unused.slice(0, MAX_UNUSED_ADDRESSES))
                      .map(({ address }) => address)
                : [],
        [addresses],
    );

    const addressLabels = useSelector(state =>
        account
            ? selectAddressLabelsForAccount(state, {
                  addresses: accountAddresses,
                  accountKey: account.key,
                  deviceStaticId: account.deviceState,
              })
            : EMPTY_ADDRESS_LABELS,
    );

    const query = normalizeForSearch(search);

    const matchesQuery = ({ address, path }: Address) =>
        normalizeForSearch(address).includes(query) ||
        normalizeForSearch(path).includes(query) ||
        normalizeForSearch(addressLabels[address] ?? '').includes(query);

    const usedAddresses = addresses?.used.filter(matchesQuery) ?? [];
    const unusedAddresses =
        addresses?.unused.slice(0, MAX_UNUSED_ADDRESSES).filter(matchesQuery) ?? [];

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
                            addressLabels={addressLabels}
                            title={<Translation id="TR_TRADING_RECEIVE_ADDRESS_NEW_ADDRESS" />}
                        />

                        <TradingUtxoReceiveAddressList
                            account={account}
                            addresses={usedAddresses}
                            addressLabels={addressLabels}
                            title={<Translation id="TR_TRADING_RECEIVE_ADDRESS_USED_ADDRESSES" />}
                        />
                    </>
                )}
            </Column>
        </Modal>
    );
};
