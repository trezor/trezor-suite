import { AccountLabel } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type EarnParams, goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type EarnAnalyticsStep,
    EarnFlow,
    EarnProvider,
} from '@suite-common/suite-types/src/staking';
import { type Account } from '@suite-common/wallet-types';
import { Box, Button, Column, IconButton, Row, Text } from '@trezor/components';
import { CaretLeftIcon, InfoIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useDispatch } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

interface YieldPageHeaderProps {
    analyticsStep: Extract<EarnAnalyticsStep, 'yield-deposit' | 'yield-withdraw'>;
    fallbackTitleId: TranslationKey;
    account?: Account;
    routeParams?: EarnParams;
    vault?: YieldDtoV2;
    isInvalid?: boolean;
}

export const YieldPageHeader = ({
    analyticsStep,
    fallbackTitleId,
    account,
    routeParams,
    vault,
    isInvalid,
}: YieldPageHeaderProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { translationString } = useTranslation();
    const { isBelowMobile } = useLayoutSize();
    const vaultName = vault?.metadata.name;
    const networkSymbol = account?.symbol;
    const isHowItWorksVisible = !isInvalid;

    const onBackClick = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: (() => {
                    switch (analyticsStep) {
                        case 'yield-deposit':
                            return 'deposit-form';
                        case 'yield-withdraw':
                            return 'withdraw-form';
                    }
                })(),
                to: 'earn-dashboard',
                networkSymbol: account?.symbol,
                vaultId: routeParams?.yieldId,
            },
        });

        dispatch(goto({ routeName: 'suite-earn' }));
    };

    const onHowItWorksClick = () => {
        if (!account || !routeParams) {
            return;
        }

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'how-it-works',
                value: analyticsStep,
                networkSymbol: account.symbol,
                vaultId: routeParams.yieldId,
            },
        });

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Yield,
                provider: EarnProvider.Morpho,
                account,
                analyticsStep,
                actionType: 'close',
                yieldContext: {
                    id: routeParams.yieldId,
                    tokenContractAddress: vault?.token.address ?? undefined,
                },
            }),
        );
    };

    return (
        <PageHeader expandable>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon={CaretLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={onBackClick}
                    data-testid="@account-subpage/back"
                    tooltip={{ content: <Translation id="TR_BACK" /> }}
                />

                {!isInvalid && account && vaultName ? (
                    <Row alignItems="center" gap={12} overflow="hidden">
                        {networkSymbol && (
                            <TokenIcon
                                placeholder={vault?.token?.symbol || vault?.token?.name || ''}
                                symbol={networkSymbol}
                                contractAddress={vault?.token?.address}
                                showNetworkIcon
                                size={32}
                                isBordered={false}
                            />
                        )}
                        <Column gap={2} overflow="hidden">
                            <Text
                                typographyStyle="body-md-strong"
                                ellipsisLineCount={isBelowMobile ? 0 : 1}
                            >
                                {vaultName}
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
                    <Row alignItems="center" gap={12}>
                        {routeParams?.symbol && (
                            <TokenIcon symbol={routeParams.symbol} size={32} isBordered={false} />
                        )}
                        <Text typographyStyle="body-md-strong">
                            <Translation id={fallbackTitleId} />
                        </Text>
                    </Row>
                )}

                {isHowItWorksVisible && (
                    <Box margin={{ left: 'auto' }}>
                        {isBelowMobile ? (
                            <IconButton
                                icon={InfoIcon}
                                intent="neutral"
                                priority="secondary"
                                size="large"
                                aria-label={translationString('TR_EARN_HOW_IT_WORKS')}
                                onClick={onHowItWorksClick}
                                isDisabled={!account || !routeParams}
                                tooltip={{ content: <Translation id="TR_EARN_HOW_IT_WORKS" /> }}
                            />
                        ) : (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                onClick={onHowItWorksClick}
                                isDisabled={!account || !routeParams}
                            >
                                <Translation id="TR_EARN_HOW_IT_WORKS" />
                            </Button>
                        )}
                    </Box>
                )}
            </Row>
        </PageHeader>
    );
};
