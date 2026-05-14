import { type ReactNode, memo, useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { BankAccount, SellFiatTrade } from 'invity-api';

import { selectTradingSellFormStep } from '@suite-common/trading';
import { AnimatedVStack, InlineAlertBox } from '@suite-native/atoms';

import { SellBankAccountPicker } from './BankAccount/SellBankAccountPicker';
import { SellFeePickerCard } from './SellFeePickerCard';
import { SellFromAccountTradePreviewCard } from './SellFromAccountTradePreviewCard';
import { SellToFiatTradePreviewCard } from './SellToFiatTradePreviewCard';

export type SellPreviewViewProps = {
    quote: SellFiatTrade | undefined;
    txnErrorString: ReactNode;
};

export const SellPreviewView = memo(({ quote, txnErrorString }: SellPreviewViewProps) => {
    const formStep = useSelector(selectTradingSellFormStep);

    const [selectedBankAccountIban, setSelectedBankAccountIban] = useState(
        quote?.bankAccounts?.[0].bankAccount,
    );

    const isTxnError = !!txnErrorString;

    const shouldSelectBankAccount = formStep === 'BANK_ACCOUNT';
    const showBankAccountPicker = shouldSelectBankAccount && selectedBankAccountIban;

    const handleBankAccountSelect = (bankAccount: BankAccount) => {
        setSelectedBankAccountIban(bankAccount.bankAccount);
    };

    return (
        <AnimatedVStack spacing="sp20" paddingVertical="sp20" layout={LinearTransition}>
            {isTxnError && (
                <Animated.View>
                    <InlineAlertBox variant="critical" title={txnErrorString} />
                </Animated.View>
            )}
            <SellFromAccountTradePreviewCard quote={quote} />
            <SellToFiatTradePreviewCard quote={quote} />
            <SellFeePickerCard quote={quote} isTxnError={isTxnError} />
            {showBankAccountPicker && (
                <SellBankAccountPicker
                    orderId={quote?.orderId}
                    selectedBankAccountIban={selectedBankAccountIban}
                    onBankAccountSelect={handleBankAccountSelect}
                />
            )}
        </AnimatedVStack>
    );
});
