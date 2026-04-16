import { memo } from 'react';
import { useSelector } from 'react-redux';

import type { BankAccount } from 'invity-api';

import { type TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { AnimatedContainerCard, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoHeader } from '@suite-native/trading-atoms';

import { SellBankAccountItem } from './SellBankAccountItem';
import { SellBankAccountSheet } from './SellBankAccountSheet';

type SellBankAccountPickerProps = {
    orderId: string | undefined;
    selectedBankAccountIban: string;
    onBankAccountSelect: (bankAccount: BankAccount) => void;
};

type MemoizedSellBankAccountPickerProps = {
    bankAccount: BankAccount;
    onPress?: () => void;
    hasCaret: boolean;
};

// memoize the component because useWatchTrade needs useTimer and it causes re-renders
const MemoizedSellBankAccountPicker = memo(
    ({ bankAccount, onPress = () => {}, hasCaret }: MemoizedSellBankAccountPickerProps) => (
        <AnimatedContainerCard noPadding>
            <TradeInfoHeader
                title={<Translation id="moduleTrading.tradingSellPreviewScreen.bankAccount" />}
            />
            <SellBankAccountItem
                bankAccount={bankAccount}
                accessoryType={hasCaret ? 'caret' : 'none'}
                onPress={onPress}
            />
        </AnimatedContainerCard>
    ),
);

export const SellBankAccountPicker = ({
    orderId,
    selectedBankAccountIban,
    onBankAccountSelect,
}: SellBankAccountPickerProps) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );

    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    if (
        trade?.tradeType !== 'sell' ||
        !trade.data.bankAccounts ||
        trade.data.bankAccounts.length === 0
    ) {
        return null;
    }

    const { bankAccounts } = trade.data;
    const firstBankAccount = bankAccounts[0];

    if (!firstBankAccount) {
        return null;
    }

    const handleBankAccountSelect = (bankAccount: BankAccount) => {
        onBankAccountSelect(bankAccount);
        closeModal();
    };

    return (
        <>
            <MemoizedSellBankAccountPicker
                bankAccount={firstBankAccount}
                onPress={openModal}
                hasCaret={bankAccounts.length > 1}
            />

            <SellBankAccountSheet
                ref={bottomSheetRef}
                bankAccounts={bankAccounts}
                selectedBankAccountIban={selectedBankAccountIban}
                onBankAccountSelect={handleBankAccountSelect}
                closeModal={closeModal}
            />
        </>
    );
};
