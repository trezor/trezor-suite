import { type ReactNode } from 'react';

import { AccountLabel } from '@suite/account';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { PageHeader } from '#src/components/suite/layouts/SuiteLayout/PageHeader/PageHeader';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';

import { EarnAccountPageHeaderGrid } from './EarnAccountPageHeaderGrid';
import { EarnPageHeaderBackButton } from './EarnPageHeaderBackButton';

type EarnAccountPageHeaderProps = {
    title: ReactNode;
    account?: Account;
    layout?: 'row' | 'grid';
    balanceFormat?: 'exact' | 'compact';
    balanceTestId?: string;
    tokenIcon?: ReactNode;
    onBack?: () => void;
    actions?: ReactNode;
    expandable?: boolean;
};

export const EarnAccountPageHeader = ({
    title,
    account,
    layout = 'row',
    balanceFormat,
    balanceTestId = '@earn/page-header/balance',
    tokenIcon,
    onBack,
    actions,
    expandable,
}: EarnAccountPageHeaderProps) => {
    const { isBelowMobile } = useLayoutSize();
    const isCompactBalance = balanceFormat === 'compact';
    const backButton = <EarnPageHeaderBackButton onClick={onBack} />;
    const icon =
        tokenIcon ?? (account ? <TokenIcon networkSymbol={account.symbol} size={32} /> : null);
    const accountLabel = account ? (
        <AccountLabel
            account={account}
            showAccountTypeBadge
            accountTypeBadgeSize="small"
            intent="neutral"
            priority="secondary"
            typographyStyle="body-sm"
        />
    ) : null;
    const balance =
        account && !!balanceFormat ? (
            <Text
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
                textWrap={isCompactBalance && layout === 'row' ? 'nowrap' : undefined}
            >
                <FormattedCryptoAmount
                    value={account.formattedBalance}
                    networkSymbol={account.symbol}
                    isCompact={isCompactBalance}
                    data-testid={balanceTestId}
                />
            </Text>
        ) : null;

    return (
        <PageHeader expandable={expandable}>
            {layout === 'grid' ? (
                <EarnAccountPageHeaderGrid
                    title={title}
                    backButton={backButton}
                    tokenIcon={icon}
                    accountLabel={accountLabel}
                    balance={balance}
                    actions={actions}
                    isBelowMobile={isBelowMobile}
                />
            ) : (
                <Row width="100%" gap={16} alignItems="center">
                    {backButton}

                    {account ? (
                        <Row alignItems="center" gap={12} overflow="hidden">
                            {icon}
                            <Column gap={2} overflow="hidden">
                                <Text
                                    typographyStyle="body-md-strong"
                                    ellipsisLineCount={isBelowMobile ? 0 : 1}
                                >
                                    {title}
                                </Text>
                                <Row
                                    justifyContent="space-between"
                                    alignItems="center"
                                    gap={isCompactBalance && isBelowMobile ? 8 : 24}
                                >
                                    {accountLabel}
                                    {balance}
                                </Row>
                            </Column>
                        </Row>
                    ) : (
                        <Text typographyStyle="body-md-strong">{title}</Text>
                    )}
                    {actions}
                </Row>
            )}
        </PageHeader>
    );
};
