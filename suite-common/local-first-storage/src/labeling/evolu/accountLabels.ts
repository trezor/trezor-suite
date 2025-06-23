import { Evolu, NonEmptyString1000, QueryRows, getOrThrow, id, nullOr } from '@evolu/common';

import { UnwrapQuery } from '../../evoluUtils';
import { toNanoId } from '../../toNanoId';

export const AccountLabelId = id('AccountLabelId');
export type AccountLabelId = typeof AccountLabelId.Type;

export const createAccountLabelId = (deviceStaticSessionId: string, accountKey: string) =>
    AccountLabelId.from(toNanoId(`${deviceStaticSessionId}-${accountKey}`));

export const AccountLabelSchema = {
    accountLabel: {
        id: AccountLabelId,
        deviceStaticSessionId: NonEmptyString1000, // Todo: is it ok?
        accountKey: NonEmptyString1000, // Todo: is it ok?
        label: nullOr(NonEmptyString1000), // Todo: 1000 enough?
    },
};

type LabelData = {
    deviceStaticSessionId: string;
    accountKey: string;
    label: string | null;
};

export class AccountLabels {
    constructor(private evolu: Evolu<typeof AccountLabelSchema>) {}

    update = ({ deviceStaticSessionId, accountKey, label }: LabelData) => {
        // Todo: replace getOrThrow wit some nice error propagation
        getOrThrow(
            this.evolu.upsert('accountLabel', {
                id: getOrThrow(createAccountLabelId(deviceStaticSessionId, accountKey)),
                deviceStaticSessionId,
                accountKey,
                label,
            }),
        );
    };

    private getQuery = () =>
        this.evolu.createQuery(db => db.selectFrom('accountLabel').selectAll());

    subscribe = (onChange: (payload: LabelData) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (!label.deviceStaticSessionId || !label.accountKey) {
                    continue;
                }

                onChange({
                    deviceStaticSessionId: label.deviceStaticSessionId,
                    accountKey: label.accountKey,
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
