import {
    type Evolu,
    type InferRow,
    NonEmptyString1000,
    type QueryRows,
    createIdFromString,
    createQueryBuilder,
    id,
    nullOr,
    object,
} from '@evolu/common';

import {
    type AddressTable,
    type EntityListener,
    type SuiteSyncAddress,
    createSuiteSyncAddressId,
    createSuiteSyncUpdateError,
} from '@suite-common/suite-sync-storage';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';

import { normalizeLabel } from './normalizeLabel';

export const AddressEvoluId = id('AddressEvoluId');
export type AddressEvoluId = typeof AddressEvoluId.Type;

export const createAddressEvoluId = (address: string, networkSymbol: NetworkSymbol) =>
    AddressEvoluId.from(createIdFromString(createSuiteSyncAddressId(address, networkSymbol)));

const addressTableColumns = {
    id: AddressEvoluId,
    label: nullOr(NonEmptyString1000),
    address: NonEmptyString1000,
    accountDescriptor: NonEmptyString1000,
    networkSymbol: NonEmptyString1000,
};

export const AddressEvoluSchema = object(addressTableColumns);

/**
 * IMPORTANT: Only additive changes allowed. Schema MUST BE always backwards
 *            compatible!
 */
export const AddressTableSchema = {
    address: addressTableColumns,
};

const createQuery = createQueryBuilder(AddressTableSchema);

export class AddressEvoluTable implements AddressTable {
    constructor(private evolu: Evolu<typeof AddressTableSchema>) {}

    update = ({ address, label, accountDescriptor, networkSymbol }: SuiteSyncAddress) => {
        const idResult = createAddressEvoluId(address, networkSymbol);

        if (!idResult.ok) {
            return err(createSuiteSyncUpdateError(idResult.error));
        }

        const validated = AddressEvoluSchema.from({
            id: idResult.value,
            address,
            label: normalizeLabel(label),
            accountDescriptor: asAccountDescriptor(accountDescriptor),
            networkSymbol: networkSymbol as NetworkSymbol,
        });

        if (!validated.ok) {
            return err(createSuiteSyncUpdateError({ caused: validated.error }));
        }

        this.evolu.upsert('address', validated.value);

        return ok();
    };

    private getQuery = () => createQuery(db => db.selectFrom('address').selectAll());

    subscribe = ({ onChange }: EntityListener<SuiteSyncAddress>) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<InferRow<typeof query>>) => {
            const acc: SuiteSyncAddress[] = [];

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
                const idToTest = createAddressEvoluId(
                    label.address,
                    label.networkSymbol as NetworkSymbol,
                );
                if (idToTest.ok && label.id !== idToTest.value) {
                    continue;
                }

                const networkSymbol = asNetworkSymbol(label.networkSymbol);

                acc.push({
                    id: createSuiteSyncAddressId(label.address, networkSymbol),
                    address: label.address,
                    label: label.label,
                    accountDescriptor: asAccountDescriptor(label.accountDescriptor),
                    networkSymbol: label.networkSymbol as NetworkSymbol,
                });
            }

            if (acc.length > 0) {
                onChange(acc);
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
