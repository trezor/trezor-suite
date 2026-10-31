import type { Condition, MessageSystem } from '@suite-common/suite-types';

/**
 * `duration` and `environment` are the only condition keys that can be decided from the clock and
 * the build's own info. Every other key (`devices`, `transport`, `settings`, `countryCodes`, `os`,
 * `browser`) needs a fact that only a running renderer reports, and in daemon mode no renderer is
 * ever created, so those facts never arrive at all.
 */
const FACT_INDEPENDENT_CONDITION_KEYS: readonly string[] = ['duration', 'environment'];

export const isFactIndependentCondition = (condition: Condition) =>
    Object.keys(condition).every(key => FACT_INDEPENDENT_CONDITION_KEYS.includes(key));

type Conditional = { conditions: Condition[] };

// Conditions are alternatives, so dropping the fact-dependent ones of an entry keeps the entry
// valid - it just stops matching through a condition whose fact is unknown. An entry left without
// any condition is dropped instead of becoming unconditional, and an entry that had none in the
// first place is kept as is.
const toFactIndependentEntries = <T extends Conditional>(entries: T[]): T[] =>
    entries.flatMap(entry => {
        if (!entry.conditions.length) {
            return [entry];
        }

        const conditions = entry.conditions.filter(isFactIndependentCondition);

        return conditions.length ? [{ ...entry, conditions }] : [];
    });

/**
 * Narrows a config to the part that can be evaluated without any renderer fact. The result is
 * always a subset of the full evaluation, so a message it reports is one that the renderer reports
 * too - which is what makes it usable as the Electron main process gate.
 */
export const toFactIndependentConfig = (config: MessageSystem): MessageSystem => ({
    ...config,
    actions: toFactIndependentEntries(config.actions),
    experiments: config.experiments && toFactIndependentEntries(config.experiments),
});
