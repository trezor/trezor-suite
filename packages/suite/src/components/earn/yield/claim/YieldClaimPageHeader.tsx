import { useDispatch } from 'react-redux';

import { AccountLabel } from '@suite/account';
import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type Account } from '@suite-common/wallet-types';
import { IconButton, Row } from '@trezor/components';
import { CaretLeftIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

type YieldClaimPageHeaderProps = {
    account?: Account;
};

export const YieldClaimPageHeader = ({ account }: YieldClaimPageHeaderProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { isBelowMobile } = useLayoutSize();

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
            <Row width="100%" gap={isBelowMobile ? 12 : 16} alignItems="center">
                <IconButton
                    icon={CaretLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size={isBelowMobile ? 'medium' : 'large'}
                    onClick={onBackClick}
                    data-testid="@account-subpage/back"
                    tooltip={{ content: <Translation id="TR_BACK" /> }}
                />
                {account ? (
                    <Row
                        gap={isBelowMobile ? 8 : 12}
                        alignItems="center"
                        flex="1"
                        overflow="hidden"
                    >
                        <TokenIcon symbol={account.symbol} size={isBelowMobile ? 24 : 32} />
                        <AccountLabel
                            account={account}
                            showAccountTypeBadge
                            accountTypeBadgeSize="small"
                            typographyStyle={isBelowMobile ? 'headline-sm' : 'headline-md'}
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
