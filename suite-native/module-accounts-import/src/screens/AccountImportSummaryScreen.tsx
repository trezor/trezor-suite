import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { getSupportedNetworks } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';
import { ErrorMessage } from '@suite-native/atoms';
import { type DiscoveryRootState, selectDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import {
    type AccountsImportStackParamList,
    type AccountsImportStackRoutes,
    type RootStackParamList,
    type StackToTabCompositeScreenProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

import { AccountAlreadyImportedScreen } from '../components/AccountAlreadyImportedScreen';
import { AccountImportConfirmFormScreen } from '../components/AccountImportConfirmFormScreen';

export const AccountImportSummaryScreen = ({
    route,
}: StackToTabCompositeScreenProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportSummary,
    RootStackParamList
>) => {
    const allNetworkSymbols = getSupportedNetworks();

    const { accountInfo, networkSymbol } = route.params;

    useInterceptNativeNavigation();

    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountByDescriptorAndNetworkSymbol(
            state,
            accountInfo.descriptor,
            networkSymbol,
        ),
    );
    const supportedNetworks = useSelector((state: DiscoveryRootState) =>
        selectDiscoveryNetworkSymbols(state, allNetworkSymbols),
    );

    const isAccountImportSupported = supportedNetworks.includes(networkSymbol);

    if (!isAccountImportSupported) {
        return (
            <ErrorMessage
                errorMessage={<Translation id="moduleAccountImport.error.unsupportedNetworkType" />}
            />
        );
    }

    if (account) {
        return <AccountAlreadyImportedScreen account={account} />;
    }

    return <AccountImportConfirmFormScreen symbol={networkSymbol} accountInfo={accountInfo} />;
};
