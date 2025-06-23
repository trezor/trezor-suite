import { Evolu, NonEmptyString1000, QueryRows, getOrThrow, id, nullOr } from '@evolu/common';

import { UnwrapQuery } from '../../evoluUtils';
import { toNanoId } from '../../toNanoId';

export const AddressLabelId = id('AddressLabelId');
export type AddressLabelId = typeof AddressLabelId.Type;

export const createAddressLabelId = (address: string) => AddressLabelId.from(toNanoId(address));

export const AddressLabelSchema = {
    addressLabel: {
        id: AddressLabelId,
        label: nullOr(NonEmptyString1000), // Todo: 1000 enough?
        address: NonEmptyString1000, // Todo: is it ok?
    },
};

type LabelData = {
    address: string;
    label: string | null;
};

export class AddressLabels {
    constructor(private evolu: Evolu<typeof AddressLabelSchema>) {}

    update = ({ address, label }: LabelData) => {
        // Todo: replace getOrThrow wit some nice error propagation
        getOrThrow(
            this.evolu.upsert('addressLabel', {
                id: getOrThrow(createAddressLabelId(address)),
                address,
                label,
            }),
        );
    };

    private getQuery = () =>
        this.evolu.createQuery(db => db.selectFrom('addressLabel').selectAll());

    subscribe = (onChange: (payload: LabelData) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (!label.address) {
                    continue;
                }

                onChange({
                    address: label.address,
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
