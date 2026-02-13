import {
    Evolu,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    createQueryBuilder,
    id,
    nullOr,
    object,
} from '@evolu/common';

import {
    EntityListener,
    OutputTable,
    SuiteSyncOutput,
    createSuiteSyncOutputId,
    createSuiteSyncUpdateError,
} from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor, asAccountDescriptor, asTxTargetId } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';

import { UnwrapQuery } from '../evoluUtils';
import { normalizeLabel } from './normalizeLabel';

export const OutputEvoluId = id('OutputLabelId');
export type OutputEvoluId = typeof OutputEvoluId.Type;

const outputTableColumns = {
    id: OutputEvoluId,
    label: nullOr(NonEmptyString1000),
    txId: NonEmptyString1000,
    outputIndex: NonEmptyString1000, // Todo: rename: txTargetId
    accountDescriptor: NonEmptyString1000,
    networkSymbol: NonEmptyString1000,
};

export const EvoluOutput = object(outputTableColumns);

/**
 * IMPORTANT: Only additive changes allowed. Schema MUST BE always backwards
 *            compatible!
 *
 * Todo: Rename to `Target`?
 */
export const OutputTableSchema = {
    output: outputTableColumns,
};

const createQuery = createQueryBuilder(OutputTableSchema);

export class OutputEvoluTable implements OutputTable {
    constructor(private evolu: Evolu<typeof OutputTableSchema>) {}

    update = ({ txId, txTargetId, label, accountDescriptor, networkSymbol }: SuiteSyncOutput) => {
        const idResult = OutputEvoluId.from(
            createIdFromString(createSuiteSyncOutputId(txId, txTargetId)),
        );

        if (!idResult.ok) {
            return err(createSuiteSyncUpdateError(idResult.error));
        }

        const validated = EvoluOutput.from({
            id: idResult.value,
            txId,
            outputIndex: `${txTargetId}`,
            label: normalizeLabel(label),
            accountDescriptor: accountDescriptor as AccountDescriptor,
            networkSymbol: networkSymbol as NetworkSymbol,
        });

        if (!validated.ok) {
            return err(createSuiteSyncUpdateError({ caused: validated.error }));
        }

        this.evolu.upsert('output', validated.value);

        return ok();
    };

    private getQuery = () => createQuery(db => db.selectFrom('output').selectAll());

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
