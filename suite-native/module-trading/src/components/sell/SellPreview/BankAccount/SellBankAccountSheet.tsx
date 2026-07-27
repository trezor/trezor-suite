import { forwardRef } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import type { BankAccount } from 'invity-api';

import { BottomSheetModal, Card, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { SellBankAccountItem } from './SellBankAccountItem';

type SellBankAccountSheetProps = {
    bankAccounts: BankAccount[];
    selectedBankAccountIban: string;
    onBankAccountSelect: (bankAccount: BankAccount) => void;
    closeModal: () => void;
};

export const SellBankAccountSheet = forwardRef<BottomSheetModalMethods, SellBankAccountSheetProps>(
    ({ bankAccounts, selectedBankAccountIban, onBankAccountSelect, closeModal }, ref) => {
        const handleBankAccountPress = (bankAccount: BankAccount) => {
            onBankAccountSelect(bankAccount);
            closeModal();
        };

        return (
            <BottomSheetModal
                ref={ref}
                title={
                    <Translation id="moduleTrading.tradingSellPreviewScreen.bankAccountSheetTitle" />
                }
                isCloseDisplayed
            >
                <VStack spacing="sp12" paddingHorizontal="sp12">
                    {bankAccounts.map(bankAccount => (
                        <Card key={bankAccount.bankAccount} noPadding>
                            <SellBankAccountItem
                                bankAccount={bankAccount}
                                accessoryType="select"
                                noBorder={true}
                                isSelected={selectedBankAccountIban === bankAccount.bankAccount}
                                onPress={() => handleBankAccountPress(bankAccount)}
                            />
                        </Card>
                    ))}
                </VStack>
            </BottomSheetModal>
        );
    },
);
