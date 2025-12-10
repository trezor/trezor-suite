import { OutputLabel, OutputLabelsStore } from '@suite-common/suite-sync-storage';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { JazzInstance } from '../createJazzInstance';
import { normalizeLabel } from './normalizeLabel';

export class OutputLabels implements OutputLabelsStore {
    constructor(private getInstance: () => Promise<JazzInstance>) {}

    update = ({ txId, outputIndex, label, accountDescriptor, networkSymbol }: OutputLabel) => {
        this.getInstance()
            .then(({ account }) => {
                if (!account.$isLoaded || !account.root.$isLoaded) {
                    console.error('OutputLabels:update error: Account not loaded');

                    return;
                }

                const normalizedLabel = normalizeLabel(label);
                const list = account.root.outputLabels;

                if (!list.$isLoaded) {
                    console.error('OutputLabels:update error: Labels list not loaded');

                    return;
                }

                // Find existing label
                let existing = null;
                for (const item of list as any) {
                    if (
                        item?.$isLoaded &&
                        item.txId === txId &&
                        item.outputIndex === outputIndex &&
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
                        txId,
                        outputIndex,
                        label: normalizedLabel,
                        accountDescriptor,
                        networkSymbol,
                    });
                }
            })
            .catch(error => {
                console.error('OutputLabels:update error:', error);
            });
    };

    subscribe = (onChange: (payload: OutputLabel) => void) => {
        let unsubscribeFn: (() => void) | null = null;

        this.getInstance()
            .then(({ account }) => {
                if (!account.$isLoaded || !account.root.$isLoaded) {
                    console.error('OutputLabels:subscribe error: Account not loaded');

                    return;
                }

                const list = account.root.outputLabels;

                if (!list.$isLoaded) {
                    console.error('OutputLabels:subscribe error: Labels list not loaded');

                    return;
                }

                const processItems = () => {
                    for (const item of list as any) {
                        if (
                            item?.$isLoaded &&
                            item.txId &&
                            typeof item.outputIndex === 'number' &&
                            item.accountDescriptor &&
                            item.networkSymbol
                        ) {
                            onChange({
                                txId: item.txId,
                                outputIndex: item.outputIndex,
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
                console.error('OutputLabels:subscribe error:', error);
            });

        return () => {
            if (unsubscribeFn) {
                unsubscribeFn();
            }
        };
    };
}
