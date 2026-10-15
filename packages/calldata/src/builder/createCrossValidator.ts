import { createPolicy } from '../policy/createPolicy';
import { type IssueWithSeverity, type PolicyResult } from '../types/policy';
import { type Issue, type IssueCode } from '../types/validation';

const defaultPolicy = createPolicy();

type CrossValidatorConfig<Values> = {
    validate: (values: Values) => IssueCode | null;
    policy?: (issues: Issue[]) => PolicyResult;
};

export const createCrossValidator =
    <Values>(config: CrossValidatorConfig<Values>) =>
    (values: Values): IssueWithSeverity[] => {
        const code = config.validate(values);

        if (code === null) return [];

        const policy = config.policy ?? defaultPolicy;

        return policy([{ code, path: null }]).issues;
    };
