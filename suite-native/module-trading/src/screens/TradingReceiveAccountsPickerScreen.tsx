import { type RouteProp, useRoute } from '@react-navigation/native';

import { AccountTypeDecisionBottomSheet, useAddCoinAccount } from '@suite-native/add-coin-account';
import { Translation } from '@suite-native/intl';
import {
    type AddCoinFlowType,
    DynamicScreenHeader,
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
} from '@suite-native/navigation';

import { AccountList } from '../components/general/AccountList/AccountList';
import { useReceiveAccountsListData } from '../hooks/general/useReceiveAccountsListData';

export const TradingReceiveAccountsPickerScreen = () => {
    const {
        params: { symbol, tradingType },
    } = useRoute<RouteProp<RootStackParamList, RootStackRoutes.ReceiveAccounts>>();

    const {
        onSelectedNetworkItem,
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeConfirmation,
        handleAccountTypeSelection,
        getAccountTypeToBeAddedName,
        bottomSheetRef,
    } = useAddCoinAccount();

    const data = useReceiveAccountsListData({ symbol });

    const flowType: AddCoinFlowType = 'trade';

    const handleAddAccount = () => onSelectedNetworkItem({ symbol, flowType });

    const handleAccountTypeSelectionTap = () => handleAccountTypeSelection(flowType);

    const handleAddAccountConfirmTap = () => handleAccountTypeConfirmation(flowType);

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        data.length > 0 ? (
                            <Translation id="moduleTrading.accountScreen.titleStep1" />
                        ) : undefined
                    }
                    closeActionType="back"
                />
            }
        >
            <AccountList
                data={data}
                symbol={symbol}
                onAddAccountTap={handleAddAccount}
                tradingType={tradingType}
            />
            <AccountTypeDecisionBottomSheet
                ref={bottomSheetRef}
                coinName={symbol}
                typeName={getAccountTypeToBeAddedName()}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleAccountTypeSelectionTap}
                onConfirmTap={handleAddAccountConfirmTap}
            />
        </Screen>
    );
};
