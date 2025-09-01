import {
    Evolu,
    NonEmptyString100,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor } from '@suite-common/wallet-types';

import { UnwrapQuery } from '../../evoluUtils';

export const AccountLabelId = id('AccountLabelId');
export type AccountLabelId = typeof AccountLabelId.Type;

export const createAccountLabelId = (
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
) => AccountLabelId.from(createIdFromString(`${accountDescriptor}-${networkSymbol}`));

export const AccountLabelSchema = {
    accountLabel: {
        id: AccountLabelId,
        accountDescriptor: NonEmptyString1000, // xpub, ypub, .. descriptor
        networkSymbol: NonEmptyString100, // btc, ltc, eth, ...
        label: nullOr(NonEmptyString1000),
    },
};

export type AccountLabel = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    label: string | null;
};

export class AccountLabels {
    constructor(private evolu: Evolu<typeof AccountLabelSchema>) {}

    update = ({ networkSymbol, accountDescriptor, label }: AccountLabel) => {
        const idResult = createAccountLabelId(accountDescriptor, networkSymbol);

        if (!idResult.ok) {
            console.error('AccountLabels:id error:', idResult.error);

            return;
        }

        const result = this.evolu.upsert('accountLabel', {
            id: idResult.value,
            accountDescriptor,
            networkSymbol,
            label,
        });

        if (!result.ok) {
            console.error('AccountLabels:update error:', result.error);

            return;
        }
    };

    private getQuery = () =>
        this.evolu.createQuery(db => db.selectFrom('accountLabel').selectAll());

    subscribe = (onChange: (payload: AccountLabel) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (label.accountDescriptor === null || label.networkSymbol === null) {
                    continue;
                }

                onChange({
                    accountDescriptor: label.accountDescriptor as unknown as AccountDescriptor,
                    networkSymbol: label.networkSymbol as NetworkSymbol,
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
