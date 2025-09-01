import {
    Evolu,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import type { WalletDescriptor } from '@suite-common/wallet-types';

import { UnwrapQuery } from '../../evoluUtils';

export const WalletLabelId = id('WalletLabelId');
export type WalletLabelId = typeof WalletLabelId.Type;

export const createWalletLabelId = (walletDescriptor: WalletDescriptor) =>
    WalletLabelId.from(createIdFromString(walletDescriptor));

export const WalletLabelSchema = {
    walletLabel: {
        // This table will have only 1 record. As every wallet has its own secret, and therefore
        // its own Evolu instance. So the Wallets label will always be just single.
        id: WalletLabelId,
        walletDescriptor: NonEmptyString1000,
        label: nullOr(NonEmptyString1000),
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
        const idResult = createWalletLabelId(walletDescriptor);

        if (!idResult.ok) {
            console.error('WalletLabels:id error:', idResult.error);

            return;
        }

        const result = this.evolu.upsert('walletLabel', {
            id: idResult.value,
            walletDescriptor,
            label,
        });

        if (!result.ok) {
            console.error('WalletLabels:update error:', result.error);

            return;
        }
    };

    subscribe = (onChange: (payload: LabelData) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (label.walletDescriptor === null) {
                    continue;
                }

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
