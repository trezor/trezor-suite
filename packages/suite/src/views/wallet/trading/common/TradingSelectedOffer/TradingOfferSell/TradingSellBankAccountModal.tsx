import { type BankAccount } from 'invity-api';

import { Translation } from '@suite/intl';
import { sellUtils } from '@suite-common/trading';
import { Badge, Column, Modal, RadioCard, Row, Text } from '@trezor/components';
import { ArrowSquareOutIcon, CheckIcon } from '@trezor/icons';
import { useAsyncClickHandler } from '@trezor/react-utils';

export type TradingSellBankAccountModalProps = {
    bankAccounts: BankAccount[];
    selectedBankAccount: BankAccount;
    onSelect: (bankAccount: BankAccount) => void;
    onAdd: () => Promise<void>;
    onClose: () => void;
};

export const TradingSellBankAccountModal = ({
    bankAccounts,
    selectedBankAccount,
    onSelect,
    onAdd,
    onClose,
}: TradingSellBankAccountModalProps) => {
    const { handleClick, disabled: isAdding } = useAsyncClickHandler();

    return (
        <Modal
            heading={<Translation id="TR_SELL_BANK_ACCOUNT_STEP" />}
            description={<Translation id="TR_SELL_BANK_ACCOUNT_TOOLTIP" />}
            onCancel={onClose}
            width={400}
            bottomContent={
                <Modal.Button
                    intent="neutral"
                    priority="secondary"
                    iconRight={ArrowSquareOutIcon}
                    isLoading={isAdding}
                    isDisabled={isAdding}
                    onClick={() => handleClick(onAdd)}
                    data-testid="@trading/bank-account-modal/add"
                >
                    <Translation id="TR_SELL_ADD_BANK_ACCOUNT" />
                </Modal.Button>
            }
        >
            <Column gap={8}>
                {bankAccounts.map(bankAccount => (
                    <RadioCard
                        key={bankAccount.bankAccount}
                        type="raised"
                        isSelected={bankAccount.bankAccount === selectedBankAccount.bankAccount}
                        onClick={() => onSelect(bankAccount)}
                        dataTestId="@trading/bank-account-modal/account"
                    >
                        <Row justifyContent="space-between" alignItems="center" gap={12}>
                            <Column gap={2} alignItems="start">
                                <Text typographyStyle="body-md-strong">{bankAccount.holder}</Text>
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    {sellUtils.formatIban(bankAccount.bankAccount)}
                                </Text>
                            </Column>

                            {bankAccount.verified ? (
                                <Badge intent="brand" size="small" iconLeft={CheckIcon}>
                                    <Translation id="TR_SELL_BANK_ACCOUNT_VERIFIED" />
                                </Badge>
                            ) : (
                                <Badge intent="neutral" size="small">
                                    <Translation id="TR_SELL_BANK_ACCOUNT_NOT_VERIFIED" />
                                </Badge>
                            )}
                        </Row>
                    </RadioCard>
                ))}
            </Column>
        </Modal>
    );
};
