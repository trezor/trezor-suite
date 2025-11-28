import {
    Evolu,
    NonEmptyString1000,
    NonNegativeNumber,
    QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import { OutputLabel, OutputLabelsStore } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor } from '@suite-common/wallet-types';

import { UnwrapQuery } from '../evoluUtils';
import { normalizeLabel } from './normalizeLabel';

export const OutputLabelId = id('OutputLabelId');
export type OutputLabelId = typeof OutputLabelId.Type;

export const createOutputLabelId = (txId: string, outputIndex: number) =>
    OutputLabelId.from(createIdFromString(`${txId}-${outputIndex}`));

export const OutputLabelSchema = {
    outputLabel: {
        id: OutputLabelId,
        label: nullOr(NonEmptyString1000),
        txId: NonEmptyString1000,
        outputIndex: NonNegativeNumber,
        accountDescriptor: NonEmptyString1000,
        networkSymbol: NonEmptyString1000,
    },
};

export class OutputLabels implements OutputLabelsStore {
    constructor(private evolu: Evolu<typeof OutputLabelSchema>) {}

    update = ({ txId, outputIndex, label, accountDescriptor, networkSymbol }: OutputLabel) => {
        const idResult = createOutputLabelId(txId, outputIndex);

        if (!idResult.ok) {
            console.error('OutputLabels:id error:', idResult.error);

            return;
        }

        const result = this.evolu.upsert('outputLabel', {
            id: idResult.value,
            txId,
            outputIndex,
            label: normalizeLabel(label),
            accountDescriptor: accountDescriptor as AccountDescriptor,
            networkSymbol: networkSymbol as NetworkSymbol,
        });

        if (!result.ok) {
            console.error('OutputLabels:update error:', result.error);

            return;
        }
    };

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('outputLabel').selectAll());

    subscribe = (onChange: (payload: OutputLabel) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (label.txId === null || label.outputIndex === null) {
                    continue;
                }

                onChange({
                    txId: label.txId,
                    outputIndex: label.outputIndex,
                    label: label.label,
                    accountDescriptor: label.accountDescriptor!,
                    networkSymbol: label.networkSymbol as NetworkSymbol,
                });
            }
        };

        const unsubscribe = this.evolu.subscribeQuery(query)(() => {
            const deviceLabels = this.evolu.getQueryRows(query);
            process(deviceLabels);
        });
        this.evolu.loadQuery(query).then(process);

        return unsubscribe;
    };
}
