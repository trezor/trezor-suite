import { IssueWithSeverity, PolicyResult } from './policy';
import { Issue, ValidationResult } from './validation';

export interface ParamResult<Output> {
    value: Output | null;
    issues: IssueWithSeverity[];
    errors: IssueWithSeverity[];
    warnings: IssueWithSeverity[];
    isValid: boolean;
}

export interface ParamConfig<Input, Output, Context> {
    validate: (input: Input, path: string, context: Context) => ValidationResult<Output>;
    policy?: (issues: Issue[]) => PolicyResult;
}

export type Param<Input, Output, Context> = (
    input: Input,
    path: string,
    context: Context,
) => ParamResult<Output>;
