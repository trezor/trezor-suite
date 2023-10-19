import {
    StackToTabCompositeScreenProps,
    Screen,
    AccountsImportStackRoutes,
    RootStackParamList,
    AccountsImportStackParamList,
} from '@suite-native/navigation';

import { AccountImportHeader } from '../components/AccountImportHeader';
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
        <Screen header={<AccountImportHeader activeStep={3} />}>
            <AccountImportSummary accountInfo={accountInfo} networkSymbol={networkSymbol} />
        </Screen>
    );
};
