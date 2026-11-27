import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { TokenIcon } from '@trezor/product-components';

import { EarnAccountPageHeader } from '#src/components/earn/common/EarnAccountPageHeader';

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
    const { analytics } = useServices(injectDesktopAnalytics);
    const navigateToTokenOverview = useNavigateToAccountRoute(account, 'wallet-tokens');

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
        <EarnAccountPageHeader
            title={<Translation id={titleId} />}
            account={account}
            tokenIcon={
                account && (
                    <TokenIcon
                        networkSymbol={account.symbol}
                        contractAddress={contractAddress}
                        showNetworkIcon
                        size={32}
                        isBordered={false}
                        wrappedTokenIcon="network"
                    />
                )
            }
            balanceFormat="exact"
            onBack={account ? handleBack : undefined}
            expandable
        />
    );
};
