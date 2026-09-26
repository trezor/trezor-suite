import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { useYieldDetailNavigation } from '../../hooks/yield/useYieldDetailNavigation';
import { type YieldListItem } from '../../types';
import { ApyValue } from '../earn/ApyValue';
import { EarnAccountCardLayout } from '../earn/EarnAccountCardLayout';

type YieldPositionCardProps = {
    item: YieldListItem;
    onClose: () => void;
};

export const YieldPositionCard = ({ item, onClose }: YieldPositionCardProps) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const { navigateToYieldDetail } = useYieldDetailNavigation();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, item.accountKey),
    );

    const onPress = useCallback(() => {
        onClose();

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                from: 'earn-dashboard',
                to: 'vault-detail',
                networkSymbol: item.networkSymbol,
                action: 'continue',
            },
        });

        navigateToYieldDetail({
            accountKey: item.accountKey,
            tokenContract: item.contractAddress,
        });
    }, [
        analytics,
        item.networkSymbol,
        item.accountKey,
        item.contractAddress,
        onClose,
        navigateToYieldDetail,
    ]);

    return (
        <EarnAccountCardLayout
            accountKey={item.accountKey}
            icon={
                <TokenIcon
                    networkSymbol={item.networkSymbol}
                    contractAddress={item.tokenContractAddress}
                    tokenSymbol={item.tokenSymbol}
                    size="extraSmall"
                    showNetworkIcon
                    wrappedTokenIcon="network"
                />
            }
            title={item.vaultName}
            description={
                <Text variant="body-sm" color="contentSecondary">
                    {account?.accountLabel || getNetworkDisplaySymbolName(item.networkSymbol)}
                </Text>
            }
            value={
                isWrappedNativeToken(item.networkSymbol, item.tokenContractAddress) ? (
                    <CompactCryptoAmountFormatter
                        value={item.tokenBalance}
                        symbol={item.networkSymbol}
                        isBalance={true}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        variant="body-md"
                        color="contentPrimary"
                    />
                ) : (
                    <CompactTokenAmountFormatter
                        value={asDecimalTokenAmount(item.tokenBalance)}
                        tokenSymbol={item.tokenSymbol}
                        tokenDecimals={item.token?.decimals}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        variant="body-md"
                        color="contentPrimary"
                    />
                )
            }
            valueDescription={
                item.apy != null && (
                    <Text variant="body-sm" color="contentSecondary">
                        {!isApyAvailable(item.apy) ? (
                            <ApyValue apy={null} withLabel />
                        ) : (
                            <Translation id="earn.apyPercentage" values={{ apy: item.apy }} />
                        )}
                    </Text>
                )
            }
            onPress={onPress}
        />
    );
};
