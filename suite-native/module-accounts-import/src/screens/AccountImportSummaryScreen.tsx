import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import {
    StackToTabCompositeScreenProps,
    Screen,
    AccountsImportStackRoutes,
    RootStackParamList,
    AccountsImportStackParamList,
} from '@suite-native/navigation';

import { AccountImportSubHeader } from '../components/AccountImportSubHeader';
import { AccountImportSummary } from '../components/AccountImportSummary';

export const AccountImportSummaryScreen = ({
    route,
}: StackToTabCompositeScreenProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportSummary,
    RootStackParamList
>) => {
    const { accountInfo, networkSymbol } = route.params;

    return (
        <Screen screenHeader={<DeviceManagerScreenHeader />} subheader={<AccountImportSubHeader />}>
            <AccountImportSummary accountInfo={accountInfo} networkSymbol={networkSymbol} />
        </Screen>
    );
};
