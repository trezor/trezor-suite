import { AccountLabel } from '@suite/account';
import { Translation, type TranslationKey } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Column, IconButton, Row, Text } from '@trezor/components';
import { CaretLeftIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

import { useNavigateToAccountRoute } from './useNavigateToAccountRoute';

type WrappedNativePageHeaderProps = {
    titleId: TranslationKey;
    account?: Account;
    contractAddress?: string;
};

export const WrappedNativePageHeader = ({
    titleId,
    account,
    contractAddress,
}: WrappedNativePageHeaderProps) => {
    const navigateToTokenOverview = useNavigateToAccountRoute(account, 'wallet-tokens');
    const { isBelowMobile } = useLayoutSize();

    return (
        <PageHeader expandable>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon={CaretLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={navigateToTokenOverview}
                    isDisabled={!account}
                    data-testid="@account-subpage/back"
                    tooltip={{ content: <Translation id="TR_BACK" /> }}
                />

                <Row alignItems="center" gap={12} overflow="hidden">
                    {account && (
                        <TokenIcon
                            symbol={account.symbol}
                            contractAddress={contractAddress}
                            showNetworkIcon
                            size={32}
                            isBordered={false}
                            wrappedTokenIcon="network"
                        />
                    )}
                    {account ? (
                        <Column gap={2} overflow="hidden">
                            <Text
                                typographyStyle="body-md-strong"
                                ellipsisLineCount={isBelowMobile ? 0 : 1}
                            >
                                <Translation id={titleId} />
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
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <FormattedCryptoAmount
                                        value={account.formattedBalance}
                                        symbol={account.symbol}
                                        isBalance
                                        data-testid="@yield/page-header/balance"
                                    />
                                </Text>
                            </Row>
                        </Column>
                    ) : (
                        <Text typographyStyle="body-md-strong">
                            <Translation id={titleId} />
                        </Text>
                    )}
                </Row>
            </Row>
        </PageHeader>
    );
};
