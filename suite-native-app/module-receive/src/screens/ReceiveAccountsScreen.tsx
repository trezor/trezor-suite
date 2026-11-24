import { useSelector } from 'react-redux';

import { parseAssetId } from '@suite-common/asset-types';
import { useTokenMetadata } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { AccountsList } from '@suite-native/accounts';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import {
    type ReceiveStackParamList,
    type ReceiveStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';
import { ReceiveAccountsHeader } from '../components/ReceiveAccountsHeader';
import { useReceiveNavigation } from '../hooks/useReceiveNavigation';

export const ReceiveAccountsScreen = ({
    route,
}: StackProps<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAccounts>) => {
    const { assetId, closeActionType } = route.params;
    const { networkSymbol, contractAddress } = parseAssetId(assetId);
    const token = useTokenMetadata(networkSymbol, contractAddress);

    const { navigateToReceiveAddressScreen } = useReceiveNavigation();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    return (
        <Screen
            header={<ReceiveAccountsHeader assetId={assetId} closeActionType={closeActionType} />}
            isScrollable={false}
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
        >
            <AccountsList
                onSelectAccount={navigateToReceiveAddressScreen}
                networkFilter={[networkSymbol]}
                tokenContract={
                    contractAddress
                        ? (token?.contract ?? toTokenAddress(contractAddress))
                        : undefined
                }
            />
        </Screen>
    );
};
