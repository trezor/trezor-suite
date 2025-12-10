import { AddressLabel, AddressLabelsStore } from '@suite-common/suite-sync-storage';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { JazzInstance } from '../createJazzInstance';
import { normalizeLabel } from './normalizeLabel';

export class AddressLabels implements AddressLabelsStore {
    constructor(private getInstance: () => Promise<JazzInstance>) {}

    update = ({ address, label, accountDescriptor, networkSymbol }: AddressLabel) => {
        this.getInstance()
            .then(({ account }) => {
                if (!account.$isLoaded || !account.root.$isLoaded) {
                    console.error('AddressLabels:update error: Account not loaded');

                    return;
                }

                const normalizedLabel = normalizeLabel(label);
                const list = account.root.addressLabels;

                if (!list.$isLoaded) {
                    console.error('AddressLabels:update error: Labels list not loaded');

                    return;
                }

                // Find existing label
                let existing = null;
                for (const item of list as any) {
                    if (
                        item?.$isLoaded &&
                        item.address === address &&
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
                        address,
                        label: normalizedLabel,
                        accountDescriptor,
                        networkSymbol,
                    });
                }
            })
            .catch(error => {
                console.error('AddressLabels:update error:', error);
            });
    };

    subscribe = (onChange: (payload: AddressLabel) => void) => {
        let unsubscribeFn: (() => void) | null = null;

        this.getInstance()
            .then(({ account }) => {
                if (!account.$isLoaded || !account.root.$isLoaded) {
                    console.error('AddressLabels:subscribe error: Account not loaded');

                    return;
                }

                const list = account.root.addressLabels;

                if (!list.$isLoaded) {
                    console.error('AddressLabels:subscribe error: Labels list not loaded');

                    return;
                }

                const processItems = () => {
                    for (const item of list as any) {
                        if (
                            item?.$isLoaded &&
                            item.address &&
                            item.accountDescriptor &&
                            item.networkSymbol
                        ) {
                            onChange({
                                address: item.address,
                                label: item.label,
                                accountDescriptor: item.accountDescriptor,
                                networkSymbol: asNetworkSymbol(item.networkSymbol),
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
                console.error('AddressLabels:subscribe error:', error);
            });

        return () => {
            if (unsubscribeFn) {
                unsubscribeFn();
            }
        };
    };
}
