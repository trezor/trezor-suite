import { AccountLabel } from '@suite/account';
import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
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
    flow: WrappedNativeFlowType;
    account?: Account;
    contractAddress?: string;
    /** Once the flow has finished, leaving via the back arrow is not abandoning it. */
    isFlowComplete?: boolean;
};

export const WrappedNativePageHeader = ({
    titleId,
    flow,
    account,
    contractAddress,
    isFlowComplete = false,
}: WrappedNativePageHeaderProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const navigateToTokenOverview = useNavigateToAccountRoute(account, 'wallet-tokens');
    const { isBelowMobile } = useLayoutSize();

    const handleBack = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: isFlowComplete ? 'continue' : 'cancel',
                from: flow === 'wrap' ? 'wrap-form' : 'unwrap-form',
                to: 'account-detail',
                networkSymbol: account?.symbol,
            },
        });
        navigateToTokenOverview();
    };

    return (
        <PageHeader expandable>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon={CaretLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={handleBack}
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
