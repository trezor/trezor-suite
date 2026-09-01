import styled from 'styled-components';

import { AccountLabel } from '@suite/account';
import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type EarnParams, goto } from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type EarnAnalyticsStep,
    EarnFlow,
    EarnProvider,
} from '@suite-common/suite-types/src/staking';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button, IconButton, Row, Text } from '@trezor/components';
import { CaretLeftIcon, InfoIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { belowBreakpoint, breakpoints } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

const HeaderLayout = styled.div`
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    gap: 2px 12px;
    align-items: center;
    width: 100%;
    min-width: 0;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        row-gap: 8px;
    }
`;

const Navigation = styled.div`
    grid-column: 1;
    grid-row: 1 / span 2;
    margin-right: 4px;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-row: 1;
    }
`;

const IdentityIcon = styled.div`
    grid-column: 2;
    grid-row: 1 / span 2;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-row: 1;
    }
`;

const IdentityTitle = styled.div`
    grid-column: 3;
    grid-row: 1;
    min-width: 0;
`;

const IdentityMeta = styled.div`
    grid-column: 3;
    grid-row: 2;
    min-width: 0;
    overflow: hidden;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-column: 1 / -1;
    }
`;

const MetaValue = styled.div`
    min-width: 0;
    overflow: hidden;
`;

const Actions = styled.div`
    grid-column: 4;
    grid-row: 1 / span 2;
    margin-left: auto;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-row: 1;
    }
`;

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
    const hasVaultIdentity = !isInvalid && !!account && !!vaultName;

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
                vaultId: vault?.id,
            },
        });

        dispatch(goto({ routeName: 'suite-earn' }));
    };

    const onHowItWorksClick = () => {
        if (!account || !vault) {
            return;
        }

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'how-it-works',
                value: analyticsStep,
                networkSymbol: account.symbol,
                vaultId: vault.id,
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
                    id: vault.id,
                    vaultAddress: getYieldVaultContractAddress(vault) ?? undefined,
                    tokenContractAddress: vault.token.address ?? undefined,
                },
            }),
        );
    };

    const identityIconNode = (() => {
        if (hasVaultIdentity && networkSymbol) {
            return (
                <IdentityIcon>
                    <TokenIcon
                        placeholder={vault?.token?.symbol || vault?.token?.name || ''}
                        symbol={networkSymbol}
                        contractAddress={vault?.token?.address}
                        showNetworkIcon
                        size={32}
                        isBordered={false}
                        wrappedTokenIcon="network"
                    />
                </IdentityIcon>
            );
        }

        if (!hasVaultIdentity && routeParams?.symbol) {
            return (
                <IdentityIcon>
                    <TokenIcon symbol={routeParams.symbol} size={32} isBordered={false} />
                </IdentityIcon>
            );
        }

        return null;
    })();

    return (
        <PageHeader expandable>
            <HeaderLayout>
                <Navigation>
                    <IconButton
                        icon={CaretLeftIcon}
                        intent="neutral"
                        priority="secondary"
                        size="large"
                        onClick={onBackClick}
                        data-testid="@account-subpage/back"
                        tooltip={{ content: <Translation id="TR_BACK" /> }}
                    />
                </Navigation>

                {identityIconNode}

                <IdentityTitle>
                    <Text
                        typographyStyle="body-md-strong"
                        ellipsisLineCount={isBelowMobile ? 2 : 1}
                    >
                        {hasVaultIdentity ? vaultName : <Translation id={fallbackTitleId} />}
                    </Text>
                </IdentityTitle>

                {hasVaultIdentity && (
                    <IdentityMeta>
                        <Row alignItems="center" gap={isBelowMobile ? 8 : 24} overflow="hidden">
                            <MetaValue>
                                <AccountLabel
                                    account={account}
                                    showAccountTypeBadge
                                    accountTypeBadgeSize="small"
                                    intent="neutral"
                                    priority="secondary"
                                    typographyStyle="body-sm"
                                />
                            </MetaValue>
                            {isBelowMobile && (
                                <Text intent="neutral" priority="secondary">
                                    •
                                </Text>
                            )}
                            <MetaValue>
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    ellipsisLineCount={1}
                                >
                                    <FormattedCryptoAmount
                                        value={account.formattedBalance}
                                        symbol={account.symbol}
                                        isBalance
                                        data-testid="@yield/page-header/balance"
                                    />
                                </Text>
                            </MetaValue>
                        </Row>
                    </IdentityMeta>
                )}

                {isHowItWorksVisible && (
                    <Actions>
                        {isBelowMobile ? (
                            <IconButton
                                icon={InfoIcon}
                                intent="neutral"
                                priority="secondary"
                                size="large"
                                aria-label={translationString('TR_EARN_HOW_IT_WORKS')}
                                onClick={onHowItWorksClick}
                                isDisabled={!account || !vault}
                                tooltip={{ content: <Translation id="TR_EARN_HOW_IT_WORKS" /> }}
                            />
                        ) : (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                onClick={onHowItWorksClick}
                                isDisabled={!account || !vault}
                            >
                                <Translation id="TR_EARN_HOW_IT_WORKS" />
                            </Button>
                        )}
                    </Actions>
                )}
            </HeaderLayout>
        </PageHeader>
    );
};
