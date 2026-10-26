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
    const { asset, closeActionType } = route.params;

    const { navigateToReceiveAddressScreen } = useReceiveNavigation();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    return (
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
            />
        </Screen>
    );
};
