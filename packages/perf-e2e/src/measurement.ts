/**
 * A scenario is measured once per device model, and the models are not equally fast: what is a
 * comfortable budget for one can be out of reach for the other. A budget is therefore looked up per
 * measurement — scenario *and* model — with the scenario-wide entry as the default.
 */

/** Names one measured run: a scenario on one device model. Used for both display and budget keys. */
export const measurementKey = (scenario: string, model: string): string =>
    model ? `${scenario} [${model}]` : scenario;

/**
 * The budget recorded for this model, or the scenario-wide one where the model has none of its own —
 * which is what a scenario has before its first per-model numbers are recorded.
 */
export const resolveBudget = <T>(
    budgets: Record<string, T>,
    scenario: string,
    model: string,
): T | undefined => budgets[measurementKey(scenario, model)] ?? budgets[scenario];
