export type ContextWith<T> = Record<string, unknown> & T;

export type ValidationResult<T> = {
    value: T | null;
    issues: Issue[];
};

export type Issue = {
    code: IssueCode;
    path: string | null;
};

export type IssueCode =
    | 'INVALID_ADDRESS'
    | 'ZERO_ADDRESS'
    | 'SELF_ADDRESS'
    | 'NOT_SAME_AS_SENDER'
    | 'ADDRESS_NOT_WHITELISTED'
    | 'NEGATIVE_AMOUNT'
    | 'INSUFFICIENT_BALANCE'
    | 'NOT_INTEGER'
    | 'ZERO_AMOUNT'
    | 'EXCEEDS_UINT16'
    | 'EXCEEDS_UINT64'
    | 'EXCEEDS_UINT256'
    | 'INVALID_BYTES32'
    | 'ARRAYS_LENGTH_MISMATCH'
    | 'ENCODING_FAILED';
