import { AccountLabel } from '@suite/account';
import { Translation, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto, selectSettingsBackRoute } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { Box, Button, Column, IconButton, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

type TronStakePageHeaderProps = {
    account?: Account;
};

export const TronStakePageHeader = ({ account }: TronStakePageHeaderProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { isBelowMobile } = useLayoutSize();
    const previousRoute = useSelector(selectSettingsBackRoute);

    const onBackClick = () => {
        dispatch(goto({ routeName: previousRoute.name, params: previousRoute.params }));
    };

    const onHowItWorksClick = () => {
        dispatch(openModal({ type: 'tron-stake-in-a-nutshell', actionType: 'close' }));
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
                    <Row alignItems="center" gap={12} overflow="hidden">
                        <CoinLogo symbol={account.symbol} size={32} />
                        <Column gap={2} overflow="hidden">
                            <Text
                                typographyStyle="body-md-strong"
                                ellipsisLineCount={isBelowMobile ? 0 : 1}
                            >
                                <Translation id="TR_EARN_STAKING_DASHBOARD_TITLE" />
                            </Text>
                            <AccountLabel
                                account={account}
                                showAccountTypeBadge
                                accountTypeBadgeSize="small"
                                intent="neutral"
                                priority="secondary"
                                typographyStyle="body-sm"
                            />
                        </Column>
                    </Row>
                ) : (
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_EARN_STAKING_DASHBOARD_TITLE" />
                    </Text>
                )}

                <Box margin={{ left: 'auto' }}>
                    {isBelowMobile ? (
                        <IconButton
                            icon="info"
                            intent="neutral"
                            priority="secondary"
                            size="large"
                            aria-label={translationString('TR_EARN_HOW_IT_WORKS')}
                            onClick={onHowItWorksClick}
                            tooltip={{ content: <Translation id="TR_EARN_HOW_IT_WORKS" /> }}
                        />
                    ) : (
                        <Button intent="neutral" priority="secondary" onClick={onHowItWorksClick}>
                            <Translation id="TR_EARN_HOW_IT_WORKS" />
                        </Button>
                    )}
                </Box>
            </Row>
        </PageHeader>
    );
};
