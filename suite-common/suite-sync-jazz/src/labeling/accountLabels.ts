import { AccountLabel, AccountLabelsStore } from '@suite-common/suite-sync-storage';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';

import { JazzInstance } from '../createJazzInstance';
import { normalizeLabel } from './normalizeLabel';

export class AccountLabels implements AccountLabelsStore {
    constructor(private getInstance: () => Promise<JazzInstance>) {}

    update = ({ networkSymbol, accountDescriptor, label }: AccountLabel) => {
        this.getInstance()
            .then(({ account }) => {
                if (!account.$isLoaded || !account.root.$isLoaded) {
                    console.error('AccountLabels:update error: Account not loaded');

                    return;
                }

                const normalizedLabel = normalizeLabel(label);
                const list = account.root.accountLabels;

                if (!list.$isLoaded) {
                    console.error('AccountLabels:update error: Labels list not loaded');

                    return;
                }

                // Find existing label
                let existing = null;
                for (const item of list) {
                    if (
                        item?.$isLoaded &&
                        item.accountDescriptor === accountDescriptor &&
                        item.networkSymbol === networkSymbol
                    ) {
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
                        accountDescriptor,
                        networkSymbol,
                        label: normalizedLabel,
                    });
                }
            })
            .catch(error => {
                console.error('AccountLabels:update error:', error);
            });
    };

    subscribe = (onChange: (payload: AccountLabel) => void) => {
        let unsubscribeFn: (() => void) | null = null;

        this.getInstance()
            .then(({ account }) => {
                if (!account.$isLoaded || !account.root.$isLoaded) {
                    console.error('AccountLabels:subscribe error: Account not loaded');

                    return;
                }

                const list = account.root.accountLabels;

                if (!list.$isLoaded) {
                    console.error('AccountLabels:subscribe error: Labels list not loaded');

                    return;
                }

                const processItems = () => {
                    for (const item of list as any) {
                        if (item?.$isLoaded && item.accountDescriptor && item.networkSymbol) {
                            onChange({
                                accountDescriptor: asAccountDescriptor(item.accountDescriptor),
                                networkSymbol: asNetworkSymbol(item.networkSymbol),
                                label: item.label,
                            });
                        }
                    }
                };

                // Initial load
                processItems();

                // Subscribe to changes
                if (list.$jazz && typeof list.$jazz.subscribe === 'function') {
                    unsubscribeFn = list.$jazz.subscribe({}, processItems);
                }
            })
            .catch(error => {
                console.error('AccountLabels:subscribe error:', error);
            });

        return () => {
            if (unsubscribeFn) {
                unsubscribeFn();
            }
        };
    };
}
