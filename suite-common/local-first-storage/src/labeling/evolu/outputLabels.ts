import {
    Evolu,
    NonEmptyString1000,
    PositiveNumber,
    QueryRows,
    getOrThrow,
    id,
    nullOr,
} from '@evolu/common';

import { UnwrapQuery } from '../../evoluUtils';
import { toNanoId } from '../../toNanoId';

export const OutputLabelId = id('OutputLabelId');
export type OutputLabelId = typeof OutputLabelId.Type;

export const createOutputLabelId = (txId: string, outputIndex: number) =>
    OutputLabelId.from(toNanoId(`${txId}-${outputIndex}`));

export const OutputLabelSchema = {
    outputLabel: {
        id: OutputLabelId,
        label: nullOr(NonEmptyString1000), // Todo: 1000 enough?
        txId: NonEmptyString1000, // Todo: is it ok?
        outputIndex: PositiveNumber,
    },
};

type LabelData = {
    txId: string;
    outputIndex: number;
    label: string | null;
};

export class OutputLabels {
    constructor(private evolu: Evolu<typeof OutputLabelSchema>) {}

    update = ({ txId, outputIndex, label }: LabelData) => {
        // Todo: replace getOrThrow wit some nice error propagation
        getOrThrow(
            this.evolu.upsert('outputLabel', {
                id: getOrThrow(createOutputLabelId(txId, outputIndex)),
                txId,
                outputIndex,
                label,
            }),
        );
    };

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('outputLabel').selectAll());

    subscribe = (onChange: (payload: LabelData) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (!label.txId || !label.outputIndex) {
                    continue;
                }

                onChange({
                    txId: label.txId,
                    outputIndex: label.outputIndex,
                    label: label.label,
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
