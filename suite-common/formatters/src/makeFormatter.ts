export type DataContext = Record<string, unknown>;

interface FormatDefinition<TInput, TOutput, TPrimitiveOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context to be used by the formatter. */
        dataContext: Partial<TDataContext>,
    ): TOutput | TPrimitiveOutput;
}

interface FormatMethod<TInput, TOutput, TPrimitiveOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context the formatter might find useful. */
        dataContext?: Partial<TDataContext>,
    ): TOutput | TPrimitiveOutput;
}

interface FormatAsPrimitiveMethod<TInput, TPrimitiveOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context the formatter might find useful. */
        dataContext?: Partial<TDataContext>,
    ): TPrimitiveOutput;
}

export interface Formatter<
    TInput,
    TOutput,
    TPrimitiveOutput = TOutput,
    TDataContext extends DataContext = DataContext,
> {
    /** Formats a value. */
    format: FormatMethod<TInput, TOutput, TPrimitiveOutput, TDataContext>;
    /** Formats a value like primitive. */
    formatAsPrimitive: FormatAsPrimitiveMethod<TInput, TPrimitiveOutput, TDataContext>;
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
    TDataContext extends DataContext = DataContext,
>(
    format: FormatDefinition<TInput, TOutput, TPrimitiveOutput, TDataContext>,
): Formatter<TInput, TOutput, TPrimitiveOutput, TDataContext> => {
    const formatter: Formatter<TInput, TOutput, TPrimitiveOutput, TDataContext> = {
        format: (value, dataContext = {}) => format(value, dataContext),
        formatAsPrimitive: (value, dataContext = {}) =>
            format(value, dataContext) as TPrimitiveOutput,
    };
    return formatter;
};
