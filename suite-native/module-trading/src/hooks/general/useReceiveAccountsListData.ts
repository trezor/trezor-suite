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

import { SectionListData } from './useSectionList';
import { ReceiveAccount } from '../../types/general';

export type ReceiveAccountsListMode = 'account' | 'address';

type UseReceiveAccountsListDataProps = {
    symbol: NetworkSymbol;
    selectedAccount: undefined | Account;
    mode: ReceiveAccountsListMode;
};

export const useReceiveAccountsListData = ({
    symbol,
    selectedAccount,
    mode,
}: UseReceiveAccountsListDataProps) => {
    const { translate } = useTranslate();

    const accounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectVisibleDeviceAccountsByNetworkSymbol(state, symbol),
    );

    return useMemo<SectionListData<ReceiveAccount>>(() => {
        if (mode === 'account') {
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

        if (!selectedAccount?.addresses) {
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
                label: translate('moduleTrading.accountScreen.newAddress'),
                data: unused.slice(0, 1).map(mapAddressToReceiveAccount),
                sectionData: undefined,
            },
            {
                key: 'used',
                label: translate('moduleTrading.accountScreen.usedAddresses'),
                data: used.map(mapAddressToReceiveAccount),
                sectionData: undefined,
            },
        ].filter(section => section.data.length > 0);
    }, [accounts, selectedAccount, translate, mode]);
};
