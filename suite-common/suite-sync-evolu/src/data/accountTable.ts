import {
    Evolu,
    NonEmptyString100,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    createQueryBuilder,
    id,
    nullOr,
    object,
} from '@evolu/common';

import {
    AccountTable,
    EntityListener,
    SuiteSyncAccount,
    createSuiteSyncAccountId,
    createSuiteSyncUpdateError,
} from '@suite-common/suite-sync-storage';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';

import { UnwrapQuery } from '../evoluUtils';
import { normalizeLabel } from './normalizeLabel';

export const AccountEvoluId = id('AccountEvoluId');
export type AccountEvoluId = typeof AccountEvoluId.Type;

const accountTableColumns = {
    id: AccountEvoluId,
    accountDescriptor: NonEmptyString1000, // xpub, ypub, .. descriptor
    networkSymbol: NonEmptyString100, // btc, ltc, eth, ...
    label: nullOr(NonEmptyString1000),
};

export const AccountEvoluSchema = object(accountTableColumns);

/**
 * IMPORTANT: Only additive changes allowed. Schema MUST BE always backwards
 *            compatible!
 */
export const AccountTableSchema = {
    account: accountTableColumns,
};

const createQuery = createQueryBuilder(AccountTableSchema);

export class EvoluAccountTable implements AccountTable {
    constructor(private evolu: Evolu<typeof AccountTableSchema>) {}

    update = ({ networkSymbol, accountDescriptor, label }: SuiteSyncAccount) => {
        const idResult = AccountEvoluId.from(
            createIdFromString(createSuiteSyncAccountId(accountDescriptor, networkSymbol)),
        );

        if (!idResult.ok) {
            return err(createSuiteSyncUpdateError(idResult.error));
        }

        const validated = AccountEvoluSchema.from({
            id: idResult.value,
            accountDescriptor,
            networkSymbol,
            label: normalizeLabel(label),
        });

        if (!validated.ok) {
            return err(createSuiteSyncUpdateError({ caused: validated.error }));
        }

        this.evolu.upsert('account', validated.value);

        return ok();
    };

    private getQuery = () => createQuery(db => db.selectFrom('account').selectAll());

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
