import { useCallback } from 'react';

import { type EventInstance, events } from '@suite-common/analytics';
import { type YieldPromoListItem } from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import { type YieldAccountNavigationDestination } from '../../utils/yield/navigateByYieldAccountState';

export type YieldEntrySheet = 'choose-account-sheet' | 'enable-network-sheet';

type ReportYieldEntryNavigationParams = {
    destination: YieldAccountNavigationDestination | YieldEntrySheet | 'earn-dashboard';
    item: Pick<YieldPromoListItem, 'networkSymbol'> & Partial<Pick<YieldPromoListItem, 'yieldId'>>;
    from: EventInstance<typeof events.yieldNavigateEvent>['payload']['from'];
};

export const useYieldEntryNavigationAnalytics = () => {
    const { analytics } = useServices(injectNativeAnalytics);

    return useCallback(
        ({ destination, item, from }: ReportYieldEntryNavigationParams) => {
            if (destination === 'firmware-update-alert') {
                analytics.report({
                    type: events.yieldDepositEvent.name,
                    payload: {
                        action: 'continue',
                        type: 'firmware-upgrade-needed-modal',
                        networkSymbol: item.networkSymbol,
                        vaultId: item.yieldId,
                    },
                });

                return;
            }

            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from,
                    to: destination,
                    networkSymbol: item.networkSymbol,
                    ...(item.yieldId && { vaultId: item.yieldId }),
                },
            });
        },
        [analytics],
    );
};
