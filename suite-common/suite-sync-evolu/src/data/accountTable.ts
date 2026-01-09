import {
    Evolu,
    NonEmptyString100,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import {
    AccountTable,
    EntityListener,
    SuiteSyncAccount,
    createSuiteSyncAccountId,
} from '@suite-common/suite-sync-storage';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';

import { UnwrapQuery } from '../evoluUtils';
import { normalizeLabel } from './normalizeLabel';

export const AccountEvoluId = id('AccountEvoluId');
export type AccountEvoluId = typeof AccountEvoluId.Type;

export const AccountSchema = {
    account: {
        id: AccountEvoluId,
        accountDescriptor: NonEmptyString1000, // xpub, ypub, .. descriptor
        networkSymbol: NonEmptyString100, // btc, ltc, eth, ...
        label: nullOr(NonEmptyString1000),
    },
};

export class EvoluAccountTable implements AccountTable {
    constructor(private evolu: Evolu<typeof AccountSchema>) {}

    update = ({ networkSymbol, accountDescriptor, label }: SuiteSyncAccount) => {
        const idResult = AccountEvoluId.from(
            createIdFromString(createSuiteSyncAccountId(accountDescriptor, networkSymbol)),
        );

        if (!idResult.ok) {
            console.error('EvoluAccountTable:id error:', idResult.error);

            return;
        }

        const result = this.evolu.upsert('account', {
            id: idResult.value,
            accountDescriptor,
            networkSymbol,
            label: normalizeLabel(label),
        });

        if (!result.ok) {
            console.error('EvoluAccountTable:update error:', result.error);

            return;
        }
    };

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('account').selectAll());

    subscribe = ({ onChange }: EntityListener<SuiteSyncAccount>) => {
        const query = this.getQuery();

        const process = (accounts: QueryRows<UnwrapQuery<typeof query>>) => {
            const acc: SuiteSyncAccount[] = [];

            for (const account of accounts) {
                if (account.accountDescriptor === null || account.networkSymbol === null) {
                    continue;
                }

                const accountDescriptor = asAccountDescriptor(account.accountDescriptor);
                const networkSymbol = asNetworkSymbol(account.networkSymbol);

                acc.push({
                    id: createSuiteSyncAccountId(accountDescriptor, networkSymbol),
                    accountDescriptor,
                    networkSymbol,
                    label: account.label,
                });
            }

            if (acc.length > 0) {
                onChange(acc);
            }
        };

        const unsubscribe = this.evolu.subscribeQuery(query)(() => {
            process(this.evolu.getQueryRows(query));
        });
        this.evolu.loadQuery(query).then(process);

        return unsubscribe;
    };
}
