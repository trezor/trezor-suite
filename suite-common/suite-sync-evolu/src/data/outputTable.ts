import {
    Evolu,
    NonEmptyString1000,
    NonNegativeNumber,
    QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import { EntityListener, OutputTable, SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor } from '@suite-common/wallet-types';

import { UnwrapQuery } from '../evoluUtils';
import { normalizeLabel } from './normalizeLabel';

export const OutputEvoluId = id('OutputLabelId');
export type OutputEvoluId = typeof OutputEvoluId.Type;

export const createOutputEvoluId = (txId: string, outputIndex: number) =>
    OutputEvoluId.from(createIdFromString(`${txId}-${outputIndex}`));

export const OutputLabelSchema = {
    output: {
        id: OutputEvoluId,
        label: nullOr(NonEmptyString1000),
        txId: NonEmptyString1000,
        outputIndex: NonNegativeNumber,
        accountDescriptor: NonEmptyString1000,
        networkSymbol: NonEmptyString1000,
    },
};

export class OutputEvoluTable implements OutputTable {
    constructor(private evolu: Evolu<typeof OutputLabelSchema>) {}

    update = ({ txId, outputIndex, label, accountDescriptor, networkSymbol }: SuiteSyncOutput) => {
        const idResult = createOutputEvoluId(txId, outputIndex);

        if (!idResult.ok) {
            console.error('OutputEvoluTable:id error:', idResult.error);

            return;
        }

        const result = this.evolu.upsert('output', {
            id: idResult.value,
            txId,
            outputIndex,
            label: normalizeLabel(label),
            accountDescriptor: accountDescriptor as AccountDescriptor,
            networkSymbol: networkSymbol as NetworkSymbol,
        });

        if (!result.ok) {
            console.error('OutputEvoluTable:update error:', result.error);

            return;
        }
    };

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('output').selectAll());

    subscribe = ({ onChange }: EntityListener<SuiteSyncOutput>) => {
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
