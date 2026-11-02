import { type Issue, type IssueCode } from './validation';

export type Severity = 'error' | 'warning' | 'ignore';

export type PolicyConfig = Record<IssueCode, Severity>;

export interface IssueWithSeverity extends Issue {
    severity: Severity;
}

export interface PolicyResult {
    issues: IssueWithSeverity[];
    errors: IssueWithSeverity[];
    warnings: IssueWithSeverity[];
    isValid: boolean;
}
