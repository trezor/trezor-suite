import { useSelector } from 'react-redux';

import { TokenMetadataProvider } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { selectAccounts } from '@suite-common/wallet-core';
import { AccountsList } from '@suite-native/accounts';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import {
    type ReceiveStackParamList,
    type ReceiveStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';
import { accountsToTokenMetadataSources } from '@suite-native/tokens';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';
import { ReceiveAccountsHeader } from '../components/ReceiveAccountsHeader';
import { useReceiveNavigation } from '../hooks/useReceiveNavigation';
import { receiveAssetOptionsToTokenMetadataSources } from '../utils/receiveAssetOptionsToTokenMetadataSources';

export const ReceiveAccountsScreen = ({
    route,
}: StackProps<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAccounts>) => {
    const { asset, closeActionType } = route.params;
    const accounts = useSelector(selectAccounts);

    const { navigateToReceiveAddressScreen } = useReceiveNavigation();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    const tokenContract = asset.isNativeToken ? undefined : toTokenAddress(asset.contractAddress);
    const metadataSources = receiveAssetOptionsToTokenMetadataSources([asset]);

    return (
        <TokenMetadataProvider
            sources={[...metadataSources, ...accountsToTokenMetadataSources(accounts)]}
        >
            <Screen
                header={<ReceiveAccountsHeader asset={asset} closeActionType={closeActionType} />}
                isScrollable={false}
                noHorizontalPadding
                noBottomPadding
                hasBottomInset={false}
            >
                <AccountsList
                    onSelectAccount={navigateToReceiveAddressScreen}
                    networkFilter={[asset.networkSymbol]}
                    tokenContract={tokenContract}
                />
            </Screen>
        </TokenMetadataProvider>
    );
};
