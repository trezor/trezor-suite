import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { IconButton, Row } from '@trezor/components';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

type YieldClaimPageHeaderProps = {
    account?: Account;
};

export const YieldClaimPageHeader = ({ account }: YieldClaimPageHeaderProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();

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
                />
                {account ? (
                    <AccountLabel
                        account={account}
                        typographyStyle="headline-md"
                        rowProps={{ flex: '1', overflow: 'hidden' }}
                    />
                ) : (
                    <BasicName>
                        <Translation id="TR_EARN" />
                    </BasicName>
                )}
            </Row>
        </PageHeader>
    );
};
