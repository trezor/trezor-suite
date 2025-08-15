import {
    Evolu,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    getOrThrow,
    id,
    nullOr,
} from '@evolu/common';

import { WalletDescriptor } from '@suite-common/wallet-types';

import { UnwrapQuery } from '../../evoluUtils';

export const WalletLabelId = id('WalletLabelId');
export type WalletLabelId = typeof WalletLabelId.Type;

export const createWalletLabelId = (walletDescriptor: string) =>
    WalletLabelId.from(createIdFromString(walletDescriptor));

export const WalletLabelSchema = {
    walletLabel: {
        // This table will have only 1 record. As every wallet has its own secret, and therefore
        // its own Evolu instance. So the Wallets label will always be just single.
        id: WalletLabelId,
        walletDescriptor: NonEmptyString1000,
        label: nullOr(NonEmptyString1000), // Todo: 1000 enough?
    },
};

type LabelData = {
    walletDescriptor: WalletDescriptor;
    label: string | null;
};

export class WalletLabels {
    constructor(private evolu: Evolu<typeof WalletLabelSchema>) {}

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('walletLabel').selectAll());

    update = ({ walletDescriptor, label }: LabelData) => {
        console.log("'______WalletLabels:update ... updating ... (", walletDescriptor, label, ')');
        const result = this.evolu.upsert('walletLabel', {
            // Todo: replace getOrThrow with some nice error propagation
            id: getOrThrow(createWalletLabelId(walletDescriptor)),
            walletDescriptor,
            label,
        });

        console.log('______WalletLabels:update', result);
    };

    subscribe = (onChange: (payload: LabelData) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            console.log('______WalletLabels::labels', labels);

            for (const label of labels) {
                if (label.walletDescriptor === null) {
                    continue;
                }

                console.log('______WalletLabels::onChange', label);

                onChange({
                    walletDescriptor: label.walletDescriptor as unknown as WalletDescriptor,
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
