import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { AccountLabel } from '@suite-native/accounts';
import { AccountTypeDecisionBottomSheet, useAddCoinAccount } from '@suite-native/add-coin-account';
import { Translation } from '@suite-native/intl';
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
import { type ReceiveAccount } from '@suite-native/trading-types';

import { AccountList } from '../components/general/AccountList/AccountList';
import { type ReceiveAccountsListMode } from '../hooks/general/useReceiveAccountsListData';

const HeaderTitle = ({
    pickerMode,
    selectedReceiveAccount,
}: {
    pickerMode: ReceiveAccountsListMode;
    selectedReceiveAccount: ReceiveAccount | undefined;
}) => {
    if (pickerMode === 'account') {
        return <Translation id="moduleTrading.accountScreen.titleStep1" />;
    }

    if (selectedReceiveAccount?.account) {
        return <AccountLabel account={selectedReceiveAccount.account} />;
    }

    return selectedReceiveAccount?.account.accountLabel;
};

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

    return (
        <Screen
            header={
                <ScreenHeader
                    title={
                        <HeaderTitle
                            pickerMode={pickerMode}
                            selectedReceiveAccount={selectedReceiveAccount}
                        />
                    }
                    closeActionType="back"
                />
            }
        >
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
