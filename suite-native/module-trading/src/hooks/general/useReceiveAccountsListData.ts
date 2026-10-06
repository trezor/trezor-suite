import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type SectionListData } from '@suite-native/trading-atoms';
import { selectVisibleDeviceAccountsByNetworkSymbolSorted } from '@suite-native/trading-state';
import { type ReceiveAccount } from '@suite-native/trading-types';

type UseReceiveAccountsListDataProps = {
    symbol: NetworkSymbol;
};

export const useReceiveAccountsListData = ({ symbol }: UseReceiveAccountsListDataProps) => {
    const accounts = useSelector((state: AccountsRootState & DeviceRootState & NetworksRootState) =>
        selectVisibleDeviceAccountsByNetworkSymbolSorted(state, symbol),
    );

    return useMemo<SectionListData<ReceiveAccount>>(() => {
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
    }, [accounts]);
};
