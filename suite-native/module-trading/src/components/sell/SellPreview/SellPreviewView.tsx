import { memo, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { BankAccount } from 'invity-api';

import { selectTradingSellFormStep, selectTradingSellSelectedQuote } from '@suite-common/trading';
import { InlineAlertBox, VStack } from '@suite-native/atoms';

import { SellBankAccountPicker } from './BankAccount/SellBankAccountPicker';
import { SellFromAccountTradePreviewCard } from './SellFromAccountTradePreviewCard';
import { SellToFiatTradePreviewCard } from './SellToFiatTradePreviewCard';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type SellPreviewViewProps = {
    txnErrorString: string | null;
};

export const SellPreviewView = memo(({ txnErrorString }: SellPreviewViewProps) => {
    const formStep = useSelector(selectTradingSellFormStep);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(selectedQuote);
    const [selectedBankAccountIban, setSelectedBankAccountIban] = useState(
        selectedQuote?.bankAccounts?.[0].bankAccount,
    );

    const isTxnError = !!txnErrorString;

    const shouldSelectBankAccount = formStep === 'BANK_ACCOUNT';
    const showBankAccountPicker = shouldSelectBankAccount && selectedBankAccountIban;

    const handleBankAccountSelect = (bankAccount: BankAccount) => {
        setSelectedBankAccountIban(bankAccount.bankAccount);
    };

    return (
        <VStack spacing="sp20" paddingVertical="sp20">
            {isTxnError && (
                <Animated.View>
                    <InlineAlertBox variant="critical" title={txnErrorString} />
                </Animated.View>
            )}
            <SellFromAccountTradePreviewCard
                quote={selectedQuote}
                fromStringValue={fromStringValue}
            />
            <SellToFiatTradePreviewCard quote={selectedQuote} toStringValue={toStringValue} />
            {showBankAccountPicker && (
                <SellBankAccountPicker
                    orderId={selectedQuote?.orderId}
                    selectedBankAccountIban={selectedBankAccountIban}
                    onBankAccountSelect={handleBankAccountSelect}
                />
            )}
        </VStack>
    );
});
