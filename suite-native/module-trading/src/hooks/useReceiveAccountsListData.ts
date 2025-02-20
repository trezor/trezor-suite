import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types/';
import { useTranslate } from '@suite-native/intl';

import { SectionListData } from '../components/general/TradingBottomSheetSectionList';
import { ReceiveAccount } from '../types';

export const useReceiveAccountsListData = (
    symbol: NetworkSymbol,
    selectedAccount: undefined | Account,
) => {
    const { translate } = useTranslate();

    const accounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectVisibleDeviceAccountsByNetworkSymbol(state, symbol),
    );

    return useMemo<SectionListData<ReceiveAccount>>(() => {
        if (!selectedAccount) {
            const data = accounts.map(account => ({ account }));

            return data.length === 0
                ? []
                : [
                      {
                          key: '',
                          label: '',
                          data,
                          sectionData: undefined,
                      },
                  ];
        }

        if (!selectedAccount.addresses) {
            return [];
        }

        const { used, unused } = selectedAccount.addresses;

        const mapAddressToReceiveAccount = (
            address: ReceiveAccount['address'],
        ): ReceiveAccount => ({
            account: selectedAccount,
            address,
        });

        return [
            {
                key: 'unused',
                label: translate('moduleTrading.accountSheet.newAddress'),
                data: unused.slice(0, 1).map(mapAddressToReceiveAccount),
                sectionData: undefined,
            },
            {
                key: 'used',
                label: translate('moduleTrading.accountSheet.usedAddresses'),
                data: used.map(mapAddressToReceiveAccount),
                sectionData: undefined,
            },
        ].filter(section => section.data.length > 0);
    }, [accounts, selectedAccount, translate]);
};
