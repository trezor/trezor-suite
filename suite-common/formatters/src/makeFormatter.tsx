export type DataContext = Record<string, unknown>;

interface FormatDefinition<TInput, TOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context to be used by the formatter. */
        dataContext: Partial<TDataContext>,
    ): TOutput;
}

interface FormatMethod<TInput, TOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Additional data context the formatter might find useful. */
        dataContext?: Partial<TDataContext>,
    ): TOutput;
}

type FormatterProps<TInput, TDataContext extends DataContext> = {
    /** Value to format. */
    value: TInput;
} & Partial<TDataContext>;

export interface Formatter<TInput, TOutput, TDataContext extends DataContext = DataContext> {
    /** Formats a value. */
    format: FormatMethod<TInput, TOutput, TDataContext>;
    (props: FormatterProps<TInput, TDataContext>): JSX.Element | null;
    /** Name of the formatter for easier debugging and profiling. */
    displayName?: string;
}

/**
 * Creates a new formatter.
 *
 * @param format Function used to format the value.
 */
export const makeFormatter = <TInput, TOutput, TDataContext extends DataContext = DataContext>(
    format: FormatDefinition<TInput, TOutput, TDataContext>,
    displayName = 'Formatter',
): Formatter<TInput, TOutput, TDataContext> => {
    const formatter: Formatter<TInput, TOutput, TDataContext> = props =>
        <>{format(props.value, props)}</> ?? null;
    formatter.displayName = displayName;

    formatter.format = (value, dataContext = {}) => format(value, dataContext);

    return formatter;
};
