import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type Account } from '@suite-common/wallet-types';
import { IconButton, Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useDispatch } from 'src/hooks/suite';

type YieldClaimPageHeaderProps = {
    account?: Account;
};

export const YieldClaimPageHeader = ({ account }: YieldClaimPageHeaderProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices<DesktopAnalyticsDep>();

    const onBackClick = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: `claim-form`,
                to: 'earn-dashboard',
                networkSymbol: account?.symbol,
            },
        });

        dispatch(goto({ routeName: 'suite-earn' }));
    };

    return (
        <PageHeader>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon="caretLeft"
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={onBackClick}
                    data-testid="@account-subpage/back"
                    tooltip={{ content: <Translation id="TR_BACK" /> }}
                />
                {account ? (
                    <Row gap={12} alignItems="center" flex="1" overflow="hidden">
                        <CoinLogo symbol={account.symbol} type="token" size={32} />
                        <AccountLabel
                            account={account}
                            showAccountTypeBadge
                            accountTypeBadgeSize="small"
                            typographyStyle="headline-md"
                            rowProps={{ flex: '1', overflow: 'hidden' }}
                        />
                    </Row>
                ) : (
                    <BasicName>
                        <Translation id="TR_EARN_CLAIM_REWARDS" />
                    </BasicName>
                )}
            </Row>
        </PageHeader>
    );
};
