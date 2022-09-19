type OutputFormat = 'default' | 'primitive' | 'structured';

export type DataContext = Record<string, unknown>;

interface FormatDefinition<
    TInput,
    TOutput,
    TPrimitiveOutput,
    TStructuredOutput,
    TDataContext extends DataContext,
> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context to be used by the formatter. */
        dataContext: Partial<TDataContext>,
        /** Output format specification. */
        outputFormat: OutputFormat,
    ): TOutput | TPrimitiveOutput | TStructuredOutput;
}

interface FormatMethod<
    TInput,
    TOutput,
    TPrimitiveOutput,
    TStructuredOutput,
    TDataContext extends DataContext,
> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context the formatter might find useful. */
        dataContext?: Partial<TDataContext>,
    ): TOutput | TPrimitiveOutput | TStructuredOutput;
}

interface FormatAsPrimitiveMethod<TInput, TPrimitiveOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context the formatter might find useful. */
        dataContext?: Partial<TDataContext>,
    ): TPrimitiveOutput;
}

interface FormatAsStructuredMethod<TInput, TStructuredOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context the formatter might find useful. */
        dataContext?: Partial<TDataContext>,
    ): TStructuredOutput;
}

export interface Formatter<
    TInput,
    TOutput,
    TPrimitiveOutput = TOutput,
    TStructuredOutput = TOutput,
    TDataContext extends DataContext = DataContext,
> {
    /** Formats a value. */
    format: FormatMethod<TInput, TOutput, TPrimitiveOutput, TStructuredOutput, TDataContext>;
    /** Formats a value like primitive. */
    formatAsPrimitive: FormatAsPrimitiveMethod<TInput, TPrimitiveOutput, TDataContext>;
    /** Formats a value as a structured object. */
    formatAsStructure: FormatAsStructuredMethod<TInput, TStructuredOutput, TDataContext>;
}

/**
 * Creates a new formatter.
 *
 * @param format Function used to format the value.
 */
export const makeFormatter = <
    TInput,
    TOutput,
    TPrimitiveOutput = TOutput,
    TStructuredOutput = TOutput,
    TDataContext extends DataContext = DataContext,
>(
    format: FormatDefinition<TInput, TOutput, TPrimitiveOutput, TStructuredOutput, TDataContext>,
): Formatter<TInput, TOutput, TPrimitiveOutput, TStructuredOutput, TDataContext> => {
    const formatter: Formatter<TInput, TOutput, TPrimitiveOutput, TStructuredOutput, TDataContext> =
        {
            format: (value, dataContext = {}) => format(value, dataContext, 'default'),
            formatAsPrimitive: (value, dataContext = {}) =>
                format(value, dataContext, 'primitive') as TPrimitiveOutput,
            formatAsStructure: (value, dataContext = {}) =>
                format(value, dataContext, 'structured') as TStructuredOutput,
        };
    return formatter;
};
