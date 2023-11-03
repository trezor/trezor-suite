import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { DeviceManager } from '@suite-native/device-switcher';

import { AccountImportSubHeader } from '../components/AccountImportSubHeader';
import { SelectableNetworkList } from '../components/SelectableNetworkList';

export const SelectNetworkScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.SelectNetwork>) => {
    const handleSelectNetworkSymbol = (networkSymbol: NetworkSymbol) => {
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {
            networkSymbol,
        });
    };

    return (
        <Screen
            screenHeader={
                <ScreenHeader>
                    <DeviceManager />
                </ScreenHeader>
            }
            subheader={<AccountImportSubHeader />}
        >
            <SelectableNetworkList onSelectItem={handleSelectNetworkSymbol} />
        </Screen>
    );
};
