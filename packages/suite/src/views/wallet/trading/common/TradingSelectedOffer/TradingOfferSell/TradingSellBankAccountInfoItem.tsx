import { useState } from 'react';

import { type BankAccount } from 'invity-api';

import { Translation } from '@suite/intl';
import { InfoItem, Text, TextButton } from '@trezor/components';
import { PencilSimpleIcon } from '@trezor/icons';

import { TradingSellBankAccountModal } from './TradingSellBankAccountModal';

export type TradingSellBankAccountInfoItemProps = {
    bankAccount: BankAccount;
    edit?: {
        bankAccounts: BankAccount[];
        onSelect: (bankAccount: BankAccount) => void;
        onAdd: () => Promise<void>;
    };
};

export const TradingSellBankAccountInfoItem = ({
    bankAccount,
    edit,
}: TradingSellBankAccountInfoItemProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const closeEditModal = () => setIsEditModalOpen(false);

    return (
        <>
            <InfoItem label={<Translation id="TR_SELL_BANK_ACCOUNT_STEP" />} direction="row">
                {edit ? (
                    <TextButton
                        onClick={() => setIsEditModalOpen(true)}
                        size="small"
                        iconRight={PencilSimpleIcon}
                        intent="brand"
                        isUnderlined
                        data-testid="@trading/offer/info/bank-account"
                    >
                        {bankAccount.holder}
                    </TextButton>
                ) : (
                    <Text typographyStyle="body-sm" data-testid="@trading/offer/info/bank-account">
                        {bankAccount.holder}
                    </Text>
                )}
            </InfoItem>

            {isEditModalOpen && edit && (
                <TradingSellBankAccountModal
                    bankAccounts={edit.bankAccounts}
                    selectedBankAccount={bankAccount}
                    onSelect={selected => {
                        edit.onSelect(selected);
                        closeEditModal();
                    }}
                    onAdd={edit.onAdd}
                    onClose={closeEditModal}
                />
            )}
        </>
    );
};
