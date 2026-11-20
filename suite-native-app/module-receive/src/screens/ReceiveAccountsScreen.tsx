import { useSelector } from 'react-redux';

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

    const { navigateToReceiveAddressScreen } = useReceiveNavigation();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    const { networkSymbol, contractAddress } = assetId;

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
                tokenContract={contractAddress}
            />
        </Screen>
    );
};
