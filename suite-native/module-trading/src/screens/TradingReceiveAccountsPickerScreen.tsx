import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    AccountTypeDecisionBottomSheet,
    useAddCoinAccount,
} from '@suite-native/module-add-accounts';
import {
    type AddCoinFlowType,
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';
import {
    selectBuySelectedReceiveAccount,
    selectExchangeSelectedReceiveAccount,
} from '@suite-native/trading-state';

import { AccountList } from '../components/general/AccountList/AccountList';
import { type ReceiveAccountsListMode } from '../hooks/general/useReceiveAccountsListData';

export const TradingReceiveAccountsPickerScreen = () => {
    const {
        params: { symbol, tradingType },
    } = useRoute<RouteProp<RootStackParamList, RootStackRoutes.ReceiveAccounts>>();

    const accountSelector =
        tradingType === 'buy'
            ? selectBuySelectedReceiveAccount
            : selectExchangeSelectedReceiveAccount;
    const selectedReceiveAccount = useSelector(accountSelector);

    const [pickerMode, setPickerMode] = useState<ReceiveAccountsListMode>('account');

    const {
        onSelectedNetworkItem,
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeConfirmation,
        handleAccountTypeSelection,
        getAccountTypeToBeAddedName,
        bottomSheetRef,
    } = useAddCoinAccount();

    const flowType: AddCoinFlowType = 'trade';

    const handleAddAccount = () => onSelectedNetworkItem({ symbol, flowType });

    const handleAccountTypeSelectionTap = () => handleAccountTypeSelection(flowType);

    const handleAddAccountConfirmTap = () => handleAccountTypeConfirmation(flowType);

    const title =
        pickerMode === 'account' ? (
            <Translation id="moduleTrading.accountScreen.titleStep1" />
        ) : (
            selectedReceiveAccount?.account.accountLabel
        );

    return (
        <Screen header={<ScreenHeader title={title} closeActionType="close" />}>
            <AccountList
                symbol={symbol}
                pickerMode={pickerMode}
                onAddAccountTap={handleAddAccount}
                onSetPickerMode={setPickerMode}
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
