import { shallowEqual } from 'react-redux';

import { createIndexQueries, createRevisions, settleSnapshot, toChanges } from './indexSnapshot';
import {
    type IdMaker,
    type Index,
    type IndexDefinition,
    type IndexId,
    type IndexSnapshot,
    type IndexSource,
} from './indexTypes';

const isIndex = <TState, TEntity>(
    source: IndexSource<TState, TEntity>,
): source is Exclude<IndexSource<TState, TEntity>, (state: TState) => unknown> =>
    typeof source !== 'function';

/**
 * An index over the entities a selector gives: every entity filed by id, read lazily, and matched
 * against the build before so that an entity the selector rebuilt unchanged keeps the object a
 * component already holds. Each build also tells which ids were added, removed and updated —
 * what every index built over this one maintains itself from.
 *
 * The selector owns the shape: it flattens, aggregates, orders and gives every entity its id. The
 * index owns identity: `ids` keeps its array while its members and order stand, an entity keeps
 * its object while it is equal to the one held, and a read against an unchanged source returns the
 * very same snapshot.
 */
export const createIndex = <TState, TEntity, TId extends IndexId, TParts = never>(
    definition: IndexDefinition<TState, TEntity, TId, TParts>,
): Index<TState, TId, TEntity> & ([TParts] extends [never] ? unknown : IdMaker<TParts, TId>) => {
    type Snapshot = IndexSnapshot<TId, TEntity>;

    const { name, source, isEqual = shallowEqual } = definition;
    const { createId } = definition;
    // Without `getId` the entity itself has the parts — the types ask for that, the compiler cannot
    // see it from in here — so the maker is read as taking the entity.
    const makeIdFromEntity = createId as unknown as ((entity: TEntity) => TId) | undefined;
    const getId =
        definition.getId ??
        ((entity: TEntity) => {
            if (makeIdFromEntity === undefined) {
                throw new Error(`index "${name}" was given neither getId nor createId`);
            }

            return makeIdFromEntity(entity);
        });

    // What was built from a source value, for as long as that value lives — so a store whose
    // accounts array comes back is answered without a build. The last build is the baseline a
    // value not seen before is matched against.
    const builds = new WeakMap<object, Snapshot>();
    const nextRevision = createRevisions();
    let last: Snapshot | undefined;

    const build = (sourceEntities: Iterable<TEntity>, previous: Snapshot | undefined): Snapshot => {
        const byId = new Map<TId, TEntity>();
        const ids: TId[] = [];
        const added: TId[] = [];
        const updated: TId[] = [];

        for (const entity of sourceEntities) {
            const id = getId(entity);

            if (byId.has(id)) {
                throw new Error(`index "${name}" was given two entities with the id ${id}`);
            }

            const held = previous?.byId.get(id);

            if (held === undefined) {
                byId.set(id, entity);

                if (previous !== undefined) {
                    added.push(id);
                }
            } else if (held === entity || isEqual(held, entity)) {
                byId.set(id, held);
            } else {
                byId.set(id, entity);
                updated.push(id);
            }

            ids.push(id);
        }

        const removed = previous?.ids.filter(id => !byId.has(id)) ?? [];

        return settleSnapshot(
            byId,
            ids,
            toChanges(added, removed, updated),
            previous,
            nextRevision,
        );
    };

    const read = (state: TState): Snapshot => {
        const sourceValue = isIndex(source) ? source.read(state) : source(state);
        const isKeyable = typeof sourceValue === 'object' && sourceValue !== null;
        const known = isKeyable ? builds.get(sourceValue) : undefined;

        if (known !== undefined) {
            return known;
        }

        const sourceEntities = isIndex(source)
            ? (sourceValue as { entities: readonly TEntity[] }).entities
            : (sourceValue as Iterable<TEntity>);

        last = build(sourceEntities, last);

        if (isKeyable) {
            builds.set(sourceValue, last);
        }

        return last;
    };

    const index: Index<TState, TId, TEntity> & IdMaker<TParts, TId> = {
        ...createIndexQueries(name, read),
        createId: parts => {
            if (createId === undefined) {
                throw new Error(`index "${name}" was given no createId`);
            }

            return createId(parts);
        },
    };

    return index;
};
