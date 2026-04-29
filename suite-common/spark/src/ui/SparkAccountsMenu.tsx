import { Button, Card, Column, Row, Text } from '@trezor/components';

import type { SparkAccount } from '../accounts/sparkAccounts';

type SparkAccountsMenuProps = {
    accounts: SparkAccount[];
    isActive: boolean;
    isSidebarCollapsed: boolean;
    selectedAccountNumber?: number;
    onSelectAccount: (accountNumber: number) => void;
};

export const SparkAccountsMenu = ({
    accounts,
    isActive,
    isSidebarCollapsed,
    selectedAccountNumber,
    onSelectAccount,
}: SparkAccountsMenuProps) => {
    if (accounts.length === 0) {
        return null;
    }

    if (isSidebarCollapsed) {
        return (
            <Column gap={8} margin={{ top: 8, bottom: 16 }}>
                {accounts.map(account => (
                    <Button
                        key={account.walletKey}
                        size="small"
                        intent={
                            isActive && selectedAccountNumber === account.accountNumber
                                ? 'brand'
                                : 'neutral'
                        }
                        priority={
                            isActive && selectedAccountNumber === account.accountNumber
                                ? 'primary'
                                : 'secondary'
                        }
                        onClick={() => onSelectAccount(account.accountNumber)}
                    >
                        S{account.accountNumber + 1}
                    </Button>
                ))}
            </Column>
        );
    }

    return (
        <Card paddingType="small">
            <Column gap={12}>
                <Text typographyStyle="body-xs" color="contentSecondary">
                    SPARK ACCOUNTS
                </Text>
                <Column gap={8}>
                    {accounts.map(account => {
                        const isSelected =
                            isActive && selectedAccountNumber === account.accountNumber;

                        return (
                            <Button
                                key={account.walletKey}
                                intent={isSelected ? 'brand' : 'neutral'}
                                priority={isSelected ? 'primary' : 'secondary'}
                                onClick={() => onSelectAccount(account.accountNumber)}
                            >
                                <Row justifyContent="space-between" width="100%">
                                    <Text>Account #{account.accountNumber + 1}</Text>
                                    <Text>{isSelected ? 'Open' : 'View'}</Text>
                                </Row>
                            </Button>
                        );
                    })}
                </Column>
            </Column>
        </Card>
    );
};
