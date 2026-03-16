import {
    type Evolu,
    NonEmptyString1000,
    type QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import {
    type EntityListener,
    type OutputTable,
    type SuiteSyncOutput,
    createSuiteSyncOutputId,
    createSuiteSyncUpdateError,
} from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountDescriptor,
    asAccountDescriptor,
    asTxTargetId,
} from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';

import { type UnwrapQuery } from '../evoluUtils';
import { normalizeLabel } from './normalizeLabel';

export const OutputEvoluId = id('OutputLabelId');
export type OutputEvoluId = typeof OutputEvoluId.Type;

/**
 * IMPORTANT: Only additive changes allowed. Schema MUST BE always backwards
 *            compatible!
 *
 * Todo: Rename to `Target`?
 */
export const OutputLabelSchema = {
    output: {
        id: OutputEvoluId,
        label: nullOr(NonEmptyString1000),
        txId: NonEmptyString1000,
        outputIndex: NonEmptyString1000, // Todo: rename: txTargetId
        accountDescriptor: NonEmptyString1000,
        networkSymbol: NonEmptyString1000,
    },
};

export class OutputEvoluTable implements OutputTable {
    constructor(private evolu: Evolu<typeof OutputLabelSchema>) {}

    update = ({ txId, txTargetId, label, accountDescriptor, networkSymbol }: SuiteSyncOutput) => {
        const idResult = OutputEvoluId.from(
            createIdFromString(createSuiteSyncOutputId(txId, txTargetId)),
        );

        if (!idResult.ok) {
            return err(createSuiteSyncUpdateError(idResult.error));
        }

        const result = this.evolu.upsert('output', {
            id: idResult.value,
            txId,
            outputIndex: `${txTargetId}`,
            label: normalizeLabel(label),
            accountDescriptor: accountDescriptor as AccountDescriptor,
            networkSymbol: networkSymbol as NetworkSymbol,
        });

        if (!result.ok) {
            return err(createSuiteSyncUpdateError(result.error));
        }

        return ok();
    };

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('output').selectAll());

    subscribe = ({ onChange }: EntityListener<SuiteSyncOutput>) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            const acc: SuiteSyncOutput[] = [];

            for (const label of labels) {
                if (
                    label.txId === null ||
                    label.outputIndex === null ||
                    label.accountDescriptor === null
                ) {
                    continue;
                }

                const accountDescriptor = asAccountDescriptor(label.accountDescriptor);

                acc.push({
                    id: createSuiteSyncOutputId(label.txId, label.outputIndex),
                    txId: label.txId,
                    txTargetId: asTxTargetId(label.outputIndex),
                    label: label.label,
                    accountDescriptor,
                    networkSymbol: label.networkSymbol as NetworkSymbol,
                });
            }

            if (acc.length > 0) {
                onChange(acc);
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
