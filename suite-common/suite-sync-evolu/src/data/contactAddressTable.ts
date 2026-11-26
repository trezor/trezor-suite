import {
    type Evolu,
    type InferRow,
    NonEmptyTrimmedString1000,
    NonNegativeInt,
    type ObjectType,
    type QueryRows,
    SqliteBoolean,
    createIdFromString,
    createQueryBuilder,
    id,
    nullOr,
    object,
    sqliteTrue,
} from '@evolu/common';

import {
    type ContactAddressTable,
    type EntityListener,
    type SuiteSyncContactAddress,
    createSuiteSyncContactAddressId,
    createSuiteSyncUpdateError,
} from '@suite-common/suite-sync-storage';
import { err, ok } from '@trezor/type-utils';

export const ContactAddressEvoluId = id('ContactAddressEvoluId');
export type ContactAddressEvoluId = typeof ContactAddressEvoluId.Output;

type CreateContactAddressEvoluIdParams = Pick<
    SuiteSyncContactAddress,
    'npub' | 'slip44' | 'address'
>;

const createContactAddressEvoluId = (params: CreateContactAddressEvoluIdParams) =>
    ContactAddressEvoluId.from(createIdFromString(createSuiteSyncContactAddressId(params)));

const contactAddressTableColumns = {
    id: ContactAddressEvoluId,
    npub: NonEmptyTrimmedString1000,
    slip44: NonNegativeInt,
    address: NonEmptyTrimmedString1000,
    signature: NonEmptyTrimmedString1000,
    spent: nullOr(SqliteBoolean),
};

export const ContactAddressEvoluSchema: ObjectType<typeof contactAddressTableColumns> = object(
    contactAddressTableColumns,
);

/**
 * IMPORTANT: Only additive changes allowed. Schema MUST BE always backwards
 *            compatible!
 */
export const ContactAddressTableSchema = {
    contactAddress: contactAddressTableColumns,
};

const createQuery = createQueryBuilder(ContactAddressTableSchema);

// Addresses and npubs are confidential, and the error may end up in a log or an error report, so
// it carries only the kind of failure, never the refused value.
const refuse = (reason: string) =>
    err(createSuiteSyncUpdateError({ table: 'contactAddress', reason }));

export class ContactAddressEvoluTable implements ContactAddressTable {
    constructor(private evolu: Evolu<typeof ContactAddressTableSchema>) {}

    update = ({ npub, slip44, address, signature, isSpent }: Partial<SuiteSyncContactAddress>) => {
        if (npub === undefined || slip44 === undefined || address === undefined) {
            return refuse('MissingKey');
        }

        const idResult = createContactAddressEvoluId({ npub, slip44, address });

        if (!idResult.ok) {
            return refuse('InvalidId');
        }

        const validated = ContactAddressEvoluSchema.fromUnknown({
            id: idResult.value,
            npub,
            slip44,
            address,
            signature,
            spent: isSpent === true ? sqliteTrue : null,
        });

        if (!validated.ok) {
            return refuse(validated.error.type);
        }

        // A paid address stays paid. Evolu writes only the columns given, so leaving `spent` out
        // keeps a paid flag that this Suite has not synced yet; writing false would undo it.
        const { spent, ...values } = validated.value;
        this.evolu.upsert('contactAddress', spent === sqliteTrue ? { ...values, spent } : values);

        return ok();
    };

    private getQuery = () => createQuery(db => db.selectFrom('contactAddress').selectAll());

    subscribe = ({ onChange }: EntityListener<SuiteSyncContactAddress>) => {
        const query = this.getQuery();

        const process = (rows: QueryRows<InferRow<typeof query>>) => {
            const addresses: SuiteSyncContactAddress[] = [];

            for (const row of rows) {
                if (
                    row.npub === null ||
                    row.slip44 === null ||
                    row.address === null ||
                    row.signature === null ||
                    row.isDeleted === sqliteTrue
                ) {
                    continue;
                }

                const key = { npub: row.npub, slip44: row.slip44, address: row.address };

                // A row whose id is not derived from its key was not written by this table.
                const expectedId = createContactAddressEvoluId(key);
                if (!expectedId.ok || row.id !== expectedId.value) {
                    continue;
                }

                addresses.push({
                    id: createSuiteSyncContactAddressId(key),
                    ...key,
                    signature: row.signature,
                    isSpent: row.spent === sqliteTrue,
                });
            }

            if (addresses.length > 0) {
                onChange(addresses);
            }
        };

        const unsubscribe = this.evolu.subscribeQuery(query)(() => {
            process(this.evolu.getQueryRows(query));
        });
        this.evolu.loadQuery(query).then(process);

        return unsubscribe;
    };
}
