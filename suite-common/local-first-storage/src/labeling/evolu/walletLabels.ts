import { Evolu, NonEmptyString1000, QueryRows, getOrThrow, id, nullOr } from '@evolu/common';

import { UnwrapQuery } from '../../evoluUtils';
import { toNanoId } from '../../toNanoId';

export const WalletLabelId = id('WalletLabelId');
export type WalletLabelId = typeof WalletLabelId.Type;

export const createWalletLabelId = (deviceStaticSessionId: string) =>
    WalletLabelId.from(toNanoId(deviceStaticSessionId));

export const WalletLabelSchema = {
    walletLabel: {
        // This table will have only 1 record. As every wallet has its own secret, and therefore
        // its own Evolu instance. So the Wallets label will always be just single.
        id: WalletLabelId,
        deviceStaticSessionId: NonEmptyString1000,
        label: nullOr(NonEmptyString1000), // Todo: 1000 enough?
    },
};

type LabelData = {
    deviceStaticSessionId: string;
    label: string | null;
};

export class WalletLabels {
    constructor(private evolu: Evolu<typeof WalletLabelSchema>) {}

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('walletLabel').selectAll());

    update = ({ deviceStaticSessionId, label }: LabelData) => {
        const result = this.evolu.upsert('walletLabel', {
            // Todo: replace getOrThrow wit some nice error propagation
            id: getOrThrow(createWalletLabelId(deviceStaticSessionId)),
            deviceStaticSessionId,
            label,
        });

        console.log('______WalletLabels:update', result);
    };

    subscribe = (onChange: (payload: LabelData) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (!label.deviceStaticSessionId) {
                    continue;
                }

                onChange({
                    deviceStaticSessionId: label.deviceStaticSessionId,
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
