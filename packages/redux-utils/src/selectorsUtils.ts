import {
    type Combiner,
    type CreateSelectorOptions,
    type GetParamsFromSelectors,
    type GetStateFromSelectors,
    type Selector,
    type SelectorArray,
    createSelectorCreator,
    weakMapMemoize,
} from 'reselect';

export { weakMapMemoize };

const EMPTY_STABLE_ARRAY: unknown[] = [];

/**
 * Returns a stable empty array reference instead of creating a new empty array each time.
 * This helps prevent unnecessary re-renders when using empty arrays in React components.
 */
export const returnStableArrayIfEmpty = <T>(array?: readonly T[] | T[]): T[] =>
    array && array.length > 0 ? (array as T[]) : (EMPTY_STABLE_ARRAY as T[]);

// For selectors with parameters, use WeakMap memoization
const createWeakMapSelectorInternal = createSelectorCreator({
    memoize: weakMapMemoize,
    argsMemoize: weakMapMemoize,
});

// [typescript-performace]: Keep this explicit type to prevent TypeScript from expanding the
// inferred type in the emitted declaration.
// Reselect's inferred output includes recursive input-selector and memoization metadata.
export type CreateWeakMapSelectorFunction<StateType = never> = {
    <InputSelectors extends SelectorArray<StateType>, Result>(
        inputSelectors: [...InputSelectors],
        combiner: Combiner<InputSelectors, Result>,
        createSelectorOptions?: CreateSelectorOptions<typeof weakMapMemoize, typeof weakMapMemoize>,
    ): Selector<
        GetStateFromSelectors<InputSelectors>,
        Result,
        GetParamsFromSelectors<InputSelectors>
    >;
    withTypes: <OverrideStateType>() => CreateWeakMapSelectorFunction<OverrideStateType>;
};

export const createWeakMapSelector = createWeakMapSelectorInternal as CreateWeakMapSelectorFunction;
