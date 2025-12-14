import {
    Evolu,
    NonEmptyString100,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import { Account, AccountTable } from '@suite-common/suite-sync-storage';
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
    },
};

export class EvoluAccountTable implements AccountTable {
    constructor(private evolu: Evolu<typeof AccountSchema>) {}

    update = ({ networkSymbol, accountDescriptor, label }: Account) => {
        const idResult = createAccountEvoluId(accountDescriptor, networkSymbol);

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

    subscribe = (onChange: (payload: Account) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (label.accountDescriptor === null || label.networkSymbol === null) {
                    continue;
                }

                onChange({
                    accountDescriptor: asAccountDescriptor(label.accountDescriptor),
                    networkSymbol: asNetworkSymbol(label.networkSymbol),
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
