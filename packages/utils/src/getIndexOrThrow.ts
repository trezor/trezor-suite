/**
 * Read an element from an array-like by index and throw if it is `undefined`.
 *
 * ⚠️ DO NOT USE THIS LIGHTLY. ⚠️
 *
 * This helper exists only to satisfy `noUncheckedIndexedAccess` in places
 * where the developer KNOWS the index is in bounds at runtime — e.g.:
 *
 *   - inside `for (let i = 0; i < arr.length; i++)`,
 *   - after an explicit `if (arr.length < N) ...` early return,
 *   - destructuring a tuple whose length is fixed by construction.
 *
 * For everything else, prefer one of:
 *
 *   - `arr[i] ?? defaultValue`              — explicit fallback,
 *   - `arr[i]?.field`                       — optional chaining,
 *   - `const x = arr[i]; if (x) …`          — runtime narrowing,
 *   - tighter types (`as const`, tuples, `satisfies Record<Union, T>`).
 *
 * If you misuse this, you trade a compile-time error for a runtime crash,
 * which is strictly worse than fixing the type properly.
 *
 * @deprecated Reach for the patterns above first. Only use this when you
 * have read the surrounding code and are certain the index cannot miss.
 */
export const getIndexOrThrow = <T>(arr: ArrayLike<T>, index: number): T => {
    const value = arr[index];
    if (value === undefined) {
        throw new Error(`getIndexOrThrow: index ${index} is out of bounds (length ${arr.length})`);
    }

    return value;
};
