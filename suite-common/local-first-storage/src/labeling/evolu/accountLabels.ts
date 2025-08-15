import {
    Evolu,
    NonEmptyString100,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    getOrThrow,
    id,
    nullOr,
} from '@evolu/common';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';

import { UnwrapQuery } from '../../evoluUtils';

export const AccountLabelId = id('AccountLabelId');
export type AccountLabelId = typeof AccountLabelId.Type;

export const createAccountLabelId = (accountKey: string, coinSymbol: string) =>
    AccountLabelId.from(createIdFromString(`${accountKey}-${coinSymbol}`));

export const AccountLabelSchema = {
    accountLabel: {
        id: AccountLabelId,
        accountDescriptor: NonEmptyString1000, // xpub, ypub, .. descriptor
        networkSymbol: NonEmptyString100, // btc, ltc, eth, ...
        label: nullOr(NonEmptyString1000), // Todo: 1000 enough?
    },
};

type LabelData = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    label: string | null;
};

export class AccountLabels {
    constructor(private evolu: Evolu<typeof AccountLabelSchema>) {}

    update = ({ networkSymbol, accountDescriptor, label }: LabelData) => {
        const result = this.evolu.upsert('accountLabel', {
            // Todo: replace getOrThrow wit some nice error propagation
            id: getOrThrow(createAccountLabelId(accountDescriptor, networkSymbol)),
            accountDescriptor,
            networkSymbol,
            label,
        });

        console.log('______AccountLabels:update', result);
    };

    private getQuery = () =>
        this.evolu.createQuery(db => db.selectFrom('accountLabel').selectAll());

    subscribe = (onChange: (payload: LabelData) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            console.log('______AccountLabels::labels', labels);
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
