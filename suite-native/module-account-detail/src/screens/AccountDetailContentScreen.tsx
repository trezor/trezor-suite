import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Screen } from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

import { AccountDetailLegacyContent } from '../components/AccountDetailLegacyContent';
import { AccountDetailSummaryContent } from '../components/AccountDetailSummaryContent';
import { AssetDetailScreenHeader } from '../components/AssetDetailScreenHeader';

type AccountDetailContentScreenProps = {
    account: Account;
    tokenContract?: TokenAddress;
};

export const AccountDetailContentScreen = ({
    account,
    tokenContract,
}: AccountDetailContentScreenProps) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const isAssetFirstHomeTableEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, account.key, tokenContract),
    );

    useEffect(() => {
        if (account) {
            analytics.report({
                type: events.assetDetailEvent.name,
                payload: {
                    assetSymbol: account.symbol,
                    tokenSymbol: token?.symbol,
                    tokenAddress: token?.contract,
                },
            });
        }
    }, [account, token?.symbol, token?.contract, analytics, token]);

    return (
        <Screen
            isScrollable={isAssetFirstHomeTableEnabled}
            header={
                <AssetDetailScreenHeader
                    account={account}
                    tokenContract={tokenContract}
                    isBalanceDisplayed={!isAssetFirstHomeTableEnabled}
                />
            }
            noHorizontalPadding
            noBottomPadding={!isAssetFirstHomeTableEnabled}
            hasBottomInset={isAssetFirstHomeTableEnabled}
        >
            {isAssetFirstHomeTableEnabled ? (
                <AccountDetailSummaryContent account={account} />
            ) : (
                <AccountDetailLegacyContent account={account} tokenContract={tokenContract} />
            )}
        </Screen>
    );
};
