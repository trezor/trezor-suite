import {
    Evolu,
    NonEmptyString1000,
    QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import { AddressLabel, AddressLabelsStore } from '@suite-common/suite-sync-storage';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor, asAccountDescriptor } from '@suite-common/wallet-types';

import { normalizeLabel } from './normalizeLabel';
import { UnwrapQuery } from '../evoluUtils';

export const AddressLabelId = id('AddressLabelId');
export type AddressLabelId = typeof AddressLabelId.Type;

export const createAddressLabelId = (address: string, networkSymbol: NetworkSymbol) =>
    AddressLabelId.from(createIdFromString(`${address}-${networkSymbol}`));

export const AddressLabelSchema = {
    addressLabel: {
        id: AddressLabelId,
        label: nullOr(NonEmptyString1000),
        address: NonEmptyString1000,
        accountDescriptor: NonEmptyString1000,
        networkSymbol: NonEmptyString1000,
    },
};

export class AddressLabels implements AddressLabelsStore {
    constructor(private evolu: Evolu<typeof AddressLabelSchema>) {}

    update = ({ address, label, accountDescriptor, networkSymbol }: AddressLabel) => {
        const idResult = createAddressLabelId(address, networkSymbol);

        if (!idResult.ok) {
            console.error('AddressLabels:id error:', idResult.error);

            return;
        }

        const result = this.evolu.upsert('addressLabel', {
            id: idResult.value,
            address,
            label: normalizeLabel(label),
            accountDescriptor: accountDescriptor as AccountDescriptor,
            networkSymbol: networkSymbol as NetworkSymbol,
        });

        if (!result.ok) {
            console.error('AddressLabels:update error:', result.error);

            return;
        }
    };

    private getQuery = () =>
        this.evolu.createQuery(db => db.selectFrom('addressLabel').selectAll());

    subscribe = (onChange: (payload: AddressLabel) => void) => {
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

                /**
                 * This needs to be checked due to compatibility issue as we had a bug,
                 * and generated ID without a `networkSymbol`. In some testing accounts,
                 * you still can have then old data for same address => this may result
                 * in wrong state of label as the old one may end-up as last one.
                 */
                const idToTest = createAddressLabelId(
                    label.address,
                    label.networkSymbol as NetworkSymbol,
                );
                if (idToTest.ok && label.id !== idToTest.value) {
                    continue;
                }

                onChange({
                    address: label.address,
                    label: label.label,
                    accountDescriptor: asAccountDescriptor(label.accountDescriptor),
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
