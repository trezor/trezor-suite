import { WalletLabel, WalletLabelsStore } from '@suite-common/suite-sync-storage';
import { asWalletDescriptor } from '@suite-common/wallet-types';

import { JazzInstance } from '../createJazzInstance';
import { normalizeLabel } from './normalizeLabel';

// Helper to subscribe to CoValue changes
function subscribeToCoValue(coValue: any, callback: () => void): () => void {
    // Jazz CoValues automatically trigger updates when changed
    // We can use the internal subscription mechanism
    if (coValue.$jazz && typeof coValue.$jazz.subscribe === 'function') {
        return coValue.$jazz.subscribe({}, callback);
    }

    // Fallback: no subscription
    return () => {};
}

export class WalletLabels implements WalletLabelsStore {
    constructor(private getInstance: () => Promise<JazzInstance>) {}

    update = ({ walletDescriptor, label }: WalletLabel) => {
        // Run async operation but don't await
        this.getInstance()
            .then(({ account }) => {
                if (!account.$isLoaded || !account.root.$isLoaded) {
                    console.error('WalletLabels:update error: Account not loaded');

                    return;
                }

                const normalizedLabel = normalizeLabel(label);
                const list = account.root.walletLabels;

                if (!list.$isLoaded) {
                    console.error('WalletLabels:update error: Labels list not loaded');

                    return;
                }

                // Find existing label
                let existing = null;
                for (const item of list as any) {
                    if (item?.$isLoaded && item.walletDescriptor === walletDescriptor) {
                        existing = item;
                        break;
                    }
                }

                if (existing) {
                    // Update existing
                    existing.$jazz.set('label', normalizedLabel);
                } else {
                    // Add new
                    list.$jazz.push({
                        walletDescriptor,
                        label: normalizedLabel,
                    });
                }
            })
            .catch(error => {
                console.error('WalletLabels:update error:', error);
            });
    };

    subscribe = (onChange: (payload: WalletLabel) => void) => {
        let unsubscribeFn: (() => void) | null = null;

        // Initialize async
        this.getInstance()
            .then(({ account }) => {
                if (!account.$isLoaded || !account.root.$isLoaded) {
                    console.error('WalletLabels:subscribe error: Account not loaded');

                    return;
                }

                const list = account.root.walletLabels;

                if (!list.$isLoaded) {
                    console.error('WalletLabels:subscribe error: Labels list not loaded');

                    return;
                }

                const processItems = () => {
                    for (const item of list as any) {
                        if (item?.$isLoaded && item.walletDescriptor) {
                            onChange({
                                walletDescriptor: asWalletDescriptor(item.walletDescriptor),
                                label: item.label,
                            });
                        }
                    }
                };

                // Initial load
                processItems();

                // Subscribe to changes using Jazz's subscription API
                unsubscribeFn = subscribeToCoValue(list, processItems);
            })
            .catch(error => {
                console.error('WalletLabels:subscribe error:', error);
            });

        return () => {
            if (unsubscribeFn) {
                unsubscribeFn();
            }
        };
    };
}
