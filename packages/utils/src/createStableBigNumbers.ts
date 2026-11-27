import { type BigNumber } from './bigNumber';

// Below this size a sweep would run on nearly every insert for little gain.
const MIN_SWEEP_SIZE = 64;

/**
 * Returns one shared instance per distinct value, so a selector computing a new BigNumber gives
 * `useSelector` the same reference while the value is unchanged.
 *
 * Instances are held through `WeakRef` and released once nothing uses them, so retention follows
 * what is actually rendered. Memoizing on the inputs instead does not fit a selector shared by many
 * callers with different arguments:
 * - `weakMapMemoize` holds primitive arguments (amounts, rates) in a plain `Map`, keeping every
 *   input ever seen.
 * - `lruMemoize` keeps the last `maxSize` inputs. Once more distinct values are rendered at once,
 *   it evicts ones still in use and returns new instances again; its lookup is also a linear scan.
 */
export const createStableBigNumbers = <Value extends BigNumber>() => {
    const instancesByValue = new Map<string, WeakRef<Value>>();
    let sweepSize = MIN_SWEEP_SIZE;

    // Runs when the map doubles, so it costs O(1) amortized per insert.
    const sweepReleasedInstances = () => {
        instancesByValue.forEach((instance, key) => {
            if (instance.deref() === undefined) {
                instancesByValue.delete(key);
            }
        });
        sweepSize = Math.max(MIN_SWEEP_SIZE, instancesByValue.size * 2);
    };

    return (value: Value): Value => {
        const key = value.toFixed();
        const stableValue = instancesByValue.get(key)?.deref();
        if (stableValue !== undefined) {
            return stableValue;
        }

        instancesByValue.set(key, new WeakRef(value));
        if (instancesByValue.size > sweepSize) {
            sweepReleasedInstances();
        }

        return value;
    };
};
