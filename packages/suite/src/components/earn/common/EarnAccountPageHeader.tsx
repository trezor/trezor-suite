import { type ReactNode } from 'react';

import { AccountLabel } from '@suite/account';
import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Column, IconButton, Row, Text } from '@trezor/components';
import { CaretLeftIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { PageHeader } from '#src/components/suite/layouts/SuiteLayout/PageHeader/PageHeader';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';

type EarnAccountPageHeaderProps = {
    title: ReactNode;
    account?: Account;
    showBalance?: boolean;
    tokenIcon?: ReactNode;
    onBack?: () => void;
    actions?: ReactNode;
    expandable?: boolean;
};

export const EarnAccountPageHeader = ({
    title,
    account,
    showBalance,
    tokenIcon,
    onBack,
    actions,
    expandable,
}: EarnAccountPageHeaderProps) => {
    const { isBelowMobile } = useLayoutSize();

    return (
        <PageHeader expandable={expandable}>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon={CaretLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={onBack}
                    isDisabled={!onBack}
                    data-testid="@account-subpage/back"
                    tooltip={{ content: <Translation id="TR_BACK" /> }}
                />

                {account ? (
                    <Row alignItems="center" gap={12} overflow="hidden">
                        {tokenIcon ?? <TokenIcon networkSymbol={account.symbol} size={32} />}
                        <Column gap={2} overflow="hidden">
                            <Text
                                typographyStyle="body-md-strong"
                                ellipsisLineCount={isBelowMobile ? 0 : 1}
                            >
                                {title}
                            </Text>
                            <Row justifyContent="space-between" alignItems="center" gap={24}>
                                <AccountLabel
                                    account={account}
                                    showAccountTypeBadge
                                    accountTypeBadgeSize="small"
                                    intent="neutral"
                                    priority="secondary"
                                    typographyStyle="body-sm"
                                />
                                {showBalance && (
                                    <Text
                                        typographyStyle="body-sm"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        <FormattedCryptoAmount
                                            value={account.formattedBalance}
                                            networkSymbol={account.symbol}
                                            data-testid="@earn/page-header/balance"
                                        />
                                    </Text>
                                )}
                            </Row>
                        </Column>
                    </Row>
                ) : (
                    <Text typographyStyle="body-md-strong">{title}</Text>
                )}
                {actions}
            </Row>
        </PageHeader>
    );
};
