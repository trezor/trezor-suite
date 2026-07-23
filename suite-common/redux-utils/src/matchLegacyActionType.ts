import { type Action } from 'redux';

declare const matchedLegacyActionType: unique symbol;

/**
 * A type guard for legacy Redux actions identified by string constants.
 *
 * Redux Toolkit action creators expose a `.match` type guard, but older action creators usually
 * expose only their string `type`. The type-only symbol retains the action narrowed by those
 * strings so it can later be recovered by {@link ActionFromMatcher} without redeclaring the
 * action's payload type.
 */
export type LegacyActionTypeMatcher<TAction extends Action> = ((
    action: Action,
) => action is TAction) & {
    // The unique-symbol property brands this intersection so no unrelated type guard can satisfy it.
    readonly [matchedLegacyActionType]: TAction;
};

/**
 * Extracts the action accepted by either a legacy action-type matcher or a regular type guard.
 */
export type ActionFromMatcher<TMatcher> =
    TMatcher extends LegacyActionTypeMatcher<infer TAction>
        ? TAction
        : TMatcher extends (action: any) => action is infer TMatchedAction
          ? TMatchedAction
          : never;

/**
 * Creates a matcher factory for one application's complete action union.
 *
 * Configuring the union once makes every returned matcher accept only known action-type strings
 * and narrow the action to the corresponding union members.
 *
 * @example
 * ```ts
 * const matchLegacyActionType = createLegacyActionTypeMatcher<AppAction>();
 * const matchesAccountUpdate = matchLegacyActionType(ACCOUNT_UPDATE, ACCOUNT_REMOVE);
 * ```
 */
export const createLegacyActionTypeMatcher = <TAction extends Action>() =>
    function matchLegacyActionType<const TActionTypes extends readonly TAction['type'][]>(
        ...actionTypes: TActionTypes
    ) {
        return ((action: Action): action is TAction & { type: TActionTypes[number] } =>
            (actionTypes as readonly string[]).includes(action.type)) as LegacyActionTypeMatcher<
            TAction & { type: TActionTypes[number] }
        >;
    };
