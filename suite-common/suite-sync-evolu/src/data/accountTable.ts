import {
    Evolu,
    NonEmptyString100,
    NonEmptyString1000,
    QueryRows,
    SqliteBoolean,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import { AccountTable, SuiteSyncAccount } from '@suite-common/suite-sync-storage';
import { NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor, asAccountDescriptor } from '@suite-common/wallet-types';

import { UnwrapQuery } from '../evoluUtils';
import { normalizeLabel } from './normalizeLabel';

export const AccountEvoluId = id('AccountEvoluId');
export type AccountEvoluId = typeof AccountEvoluId.Type;

export const createAccountEvoluId = (
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
) => AccountEvoluId.from(createIdFromString(`${accountDescriptor}-${networkSymbol}`));

export const AccountSchema = {
    account: {
        id: AccountEvoluId,
        accountDescriptor: NonEmptyString1000, // xpub, ypub, .. descriptor
        networkSymbol: NonEmptyString100, // btc, ltc, eth, ...
        label: nullOr(NonEmptyString1000),
        isHidden: SqliteBoolean,
    },
};

export class EvoluAccountTable implements AccountTable {
    constructor(private evolu: Evolu<typeof AccountSchema>) {}

    update = ({ networkSymbol, accountDescriptor, label }: SuiteSyncAccount) => {
        const idResult = createAccountEvoluId(accountDescriptor, networkSymbol);

        if (!idResult.ok) {
            console.error('EvoluAccountTable:id error:', idResult.error);

            return;
        }

        const result = this.evolu.update('account', {
            id: idResult.value,
            accountDescriptor,
            networkSymbol,
            label: normalizeLabel(label),
            isHidden: 1, // SQLite does not support bool
        });

        if (!result.ok) {
            console.error('EvoluAccountTable:update error:', result.error);

            return;
        }
    };

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('account').selectAll());

    subscribe = (onChange: (payload: SuiteSyncAccount) => void) => {
        const query = this.getQuery();

        const process = (accounts: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const account of accounts) {
                if (account.accountDescriptor === null || account.networkSymbol === null) {
                    continue;
                }

                onChange({
                    accountDescriptor: asAccountDescriptor(account.accountDescriptor),
                    networkSymbol: asNetworkSymbol(account.networkSymbol),
                    label: account.label,
                    isHidden: account.isHidden === 1, // SQLite does not support bool
                });
            }
        };

        const unsubscribe = this.evolu.subscribeQuery(query)(() => {
            process(this.evolu.getQueryRows(query));
        });
        this.evolu.loadQuery(query).then(process);

        return unsubscribe;
    };
}
