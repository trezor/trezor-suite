import {
    Evolu,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import { AddressTable, SuiteSyncAddress } from '@suite-common/suite-sync-storage';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';

import { normalizeLabel } from './normalizeLabel';
import { UnwrapQuery } from '../evoluUtils';

export const AddressEvoluId = id('AddressEvoluId');
export type AddressEvoluId = typeof AddressEvoluId.Type;

export const createAddressEvoluId = (address: string) =>
    AddressEvoluId.from(createIdFromString(address));

export const AddressLabelSchema = {
    address: {
        id: AddressEvoluId,
        label: nullOr(NonEmptyString1000),
        address: NonEmptyString1000,
        accountDescriptor: NonEmptyString1000,
        networkSymbol: NonEmptyString1000,
    },
};

export class AddressEvoluTable implements AddressTable {
    constructor(private evolu: Evolu<typeof AddressLabelSchema>) {}

    update = ({ address, label, accountDescriptor, networkSymbol }: SuiteSyncAddress) => {
        const idResult = createAddressEvoluId(address);

        if (!idResult.ok) {
            console.error('AddressEvoluTable:id error:', idResult.error);

            return;
        }

        const result = this.evolu.upsert('address', {
            id: idResult.value,
            address,
            label: normalizeLabel(label),
            accountDescriptor: accountDescriptor as AccountDescriptor,
            networkSymbol: networkSymbol as NetworkSymbol,
        });

        if (!result.ok) {
            console.error('AddressEvoluTable:update error:', result.error);

            return;
        }
    };

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('address').selectAll());

    subscribe = (onChange: (payload: SuiteSyncAddress) => void) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            for (const label of labels) {
                if (
                    label.address === null ||
                    label.accountDescriptor === null ||
                    label.networkSymbol === null
                ) {
                    continue;
                }

                onChange({
                    address: label.address,
                    label: label.label,
                    accountDescriptor: label.accountDescriptor,
                    networkSymbol: label.networkSymbol as NetworkSymbol,
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
