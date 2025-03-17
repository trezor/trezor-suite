import { useState } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { RouteProp, useRoute } from '@react-navigation/native';

import { useTranslate } from '@suite-native/intl';
import {
    AccountTypeDecisionBottomSheet,
    useAddCoinAccount,
} from '@suite-native/module-add-accounts';
import {
    AddCoinFlowType,
    Screen,
    ScreenHeader,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

import { AccountsList } from '../components/general/AccountSheet/AccountsList';
import { ReceiveAccountsListMode } from '../hooks/useReceiveAccountsListData';
import { selectBuySelectedReceiveAccount } from '../selectors/buySelectors';

export const ReceiveAccountsPickerScreen = () => {
    const {
        params: { symbol },
    } = useRoute<RouteProp<TradingStackParamList, TradingStackRoutes.ReceiveAccounts>>();

    const { translate } = useTranslate();

    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    const [pickerMode, setPickerMode] = useState<ReceiveAccountsListMode>('account');

    const {
        onSelectedNetworkItem,
        networkSymbolWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        handleAccountTypeConfirmation,
        handleAccountTypeSelection,
        getAccountTypeToBeAddedName,
    } = useAddCoinAccount();

    const flowType: AddCoinFlowType = 'trade';

    const handleAddAccount = () => onSelectedNetworkItem({ symbol, flowType });

    const handleAccountTypeSelectionTap = () => handleAccountTypeSelection(flowType);

    const handleAddAccountConfirmTap = () => handleAccountTypeConfirmation(flowType);

    const title =
        pickerMode === 'account'
            ? translate('moduleTrading.accountScreen.titleStep1')
            : selectedReceiveAccount?.account.accountLabel;

    return (
        <Screen header={<ScreenHeader content={title} closeActionType="close" />}>
            <AccountsList
                symbol={symbol}
                pickerMode={pickerMode}
                onAddAccountTap={handleAddAccount}
                onSetPickerMode={setPickerMode}
            />
            <AccountTypeDecisionBottomSheet
                coinName={symbol}
                typeName={getAccountTypeToBeAddedName()}
                isVisible={G.isNotNullable(networkSymbolWithTypeToBeAdded)}
                onClose={clearNetworkWithTypeToBeAdded}
                onTypeSelectionTap={handleAccountTypeSelectionTap}
                onConfirmTap={handleAddAccountConfirmTap}
            />
        </Screen>
    );
};
