import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type EarnParams } from '@suite/router';
import { events } from '@suite-common/analytics';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type EarnAnalyticsStep,
    EarnFlow,
    EarnProvider,
} from '@suite-common/suite-types/src/staking';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button, IconButton } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { InfoIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnAccountPageHeader } from '#src/components/earn/common/EarnAccountPageHeader';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';

import { useYieldBackNavigation } from '../hooks/useYieldBackNavigation';

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
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { translationString } = useTranslation();
    const { isBelowMobile } = useLayoutSize();
    const vaultName = vault?.metadata.name;
    const hasVaultIdentity = !isInvalid && !!account && !!vaultName;

    const onBackClick = useYieldBackNavigation({
        flowType: analyticsStep === 'yield-deposit' ? 'deposit' : 'withdraw',
        account,
        vault,
    });

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

    const fallbackIcon = routeParams?.symbol ? (
        <TokenIcon networkSymbol={routeParams.symbol} size={32} isBordered={false} />
    ) : null;
    const tokenIcon = hasVaultIdentity ? (
        <TokenIcon
            placeholder={vault?.token?.symbol || vault?.token?.name || ''}
            networkSymbol={account.symbol}
            contractAddress={vault?.token?.address}
            showNetworkIcon
            size={32}
            isBordered={false}
            wrappedTokenIcon="network"
        />
    ) : (
        fallbackIcon
    );

    const howItWorks = isBelowMobile ? (
        <IconButton
            icon={InfoIcon}
            intent="neutral"
            priority="secondary"
            size="large"
            aria-label={translationString('TR_EARN_HOW_IT_WORKS')}
            onClick={onHowItWorksClick}
            isDisabled={!account || !vault}
            data-testid="@yield/page-header/how-it-works-button"
            tooltip={{ content: <Translation id="TR_EARN_HOW_IT_WORKS" /> }}
        />
    ) : (
        <Button
            intent="neutral"
            priority="secondary"
            onClick={onHowItWorksClick}
            isDisabled={!account || !vault}
            data-testid="@yield/page-header/how-it-works-button"
        >
            <Translation id="TR_EARN_HOW_IT_WORKS" />
        </Button>
    );

    return (
        <EarnAccountPageHeader
            title={hasVaultIdentity ? vaultName : <Translation id={fallbackTitleId} />}
            account={hasVaultIdentity ? account : undefined}
            layout="grid"
            balanceFormat="compact"
            balanceTestId="@yield/page-header/balance"
            tokenIcon={tokenIcon}
            onBack={onBackClick}
            actions={isInvalid ? undefined : howItWorks}
            expandable
        />
    );
};
