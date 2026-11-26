import {
    type Evolu,
    type InferRow,
    NonEmptyTrimmedString1000,
    type ObjectType,
    type QueryRows,
    createIdFromString,
    createQueryBuilder,
    id,
    object,
    sqliteFalse,
    sqliteTrue,
} from '@evolu/common';

import {
    type ContactTable,
    type EntityListener,
    type SuiteSyncContact,
    createSuiteSyncContactId,
    createSuiteSyncUpdateError,
} from '@suite-common/suite-sync-storage';
import { err, ok } from '@trezor/type-utils';

export const ContactEvoluId = id('ContactEvoluId');
export type ContactEvoluId = typeof ContactEvoluId.Output;

const createContactEvoluId = (npub: string) =>
    ContactEvoluId.from(createIdFromString(createSuiteSyncContactId(npub)));

const contactTableColumns = {
    id: ContactEvoluId,
    npub: NonEmptyTrimmedString1000,
    name: NonEmptyTrimmedString1000,
};

export const ContactEvoluSchema: ObjectType<typeof contactTableColumns> =
    object(contactTableColumns);

/**
 * IMPORTANT: Only additive changes allowed. Schema MUST BE always backwards
 *            compatible!
 */
export const ContactTableSchema = {
    contact: contactTableColumns,
};

const createQuery = createQueryBuilder(ContactTableSchema);

// Names and npubs are confidential, and the error may end up in a log or an error report, so it
// carries only the kind of failure, never the refused value.
const refuse = (reason: string) => err(createSuiteSyncUpdateError({ table: 'contact', reason }));

export class ContactEvoluTable implements ContactTable {
    constructor(private evolu: Evolu<typeof ContactTableSchema>) {}

    update = ({ npub, name, isDeleted }: Partial<SuiteSyncContact>) => {
        if (npub === undefined) {
            return refuse('MissingNpub');
        }

        const idResult = createContactEvoluId(npub);

        if (!idResult.ok) {
            return refuse('InvalidId');
        }

        if (isDeleted) {
            this.evolu.update('contact', { id: idResult.value, isDeleted: sqliteTrue });

            return ok();
        }

        const validated = ContactEvoluSchema.fromUnknown({ id: idResult.value, npub, name });

        if (!validated.ok) {
            return refuse(validated.error.type);
        }

        this.evolu.upsert('contact', { ...validated.value, isDeleted: sqliteFalse });

        return ok();
    };

    private getQuery = () => createQuery(db => db.selectFrom('contact').selectAll());

    subscribe = ({ onChange }: EntityListener<SuiteSyncContact>) => {
        const query = this.getQuery();

        const process = (rows: QueryRows<InferRow<typeof query>>) => {
            const contacts: SuiteSyncContact[] = [];

            for (const row of rows) {
                if (row.npub === null || row.name === null) {
                    continue;
                }

                // A row whose id is not derived from its npub was not written by this table.
                const expectedId = createContactEvoluId(row.npub);
                if (!expectedId.ok || row.id !== expectedId.value) {
                    continue;
                }

                contacts.push({
                    id: createSuiteSyncContactId(row.npub),
                    npub: row.npub,
                    name: row.name,
                    isDeleted: row.isDeleted === sqliteTrue,
                });
            }

            if (contacts.length > 0) {
                onChange(contacts);
            }
        };

        const unsubscribe = this.evolu.subscribeQuery(query)(() => {
            process(this.evolu.getQueryRows(query));
        });
        this.evolu.loadQuery(query).then(process);

        return unsubscribe;
    };
}
