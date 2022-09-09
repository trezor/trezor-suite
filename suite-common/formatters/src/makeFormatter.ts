type PrimitiveSuggestion = 'primitive' | 'comparable';

type Suggestion =
    | PrimitiveSuggestion
    | 'abbreviated'
    | 'as-icon'
    /**
     * @deprecated Since v0.6.3. Use `"as-icon"` or `"with-icon"` instead.
     */
    | 'icon'
    | 'verbose'
    | 'with-icon';

const ensureFormatSuggestionIntegrity = (suggestions: Suggestion[]): Suggestion[] =>
    suggestions.includes('primitive') || !suggestions.includes('comparable')
        ? suggestions
        : ['primitive', ...suggestions];

const ensureFormatAsPrimitiveSuggestionIntegrity = (suggestions: Suggestion[]): Suggestion[] =>
    suggestions.includes('primitive') ? suggestions : ['primitive', ...suggestions];

type DataContext = Record<string, any>;

interface FormatterOptions {
    /** Formatter name, useful for debugging or advanced pattern matching. */
    displayName?: string;
}

interface FormatDefinition<TInput, TOutput, TPrimitiveOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Suggestions passed by the consumer of a formatter. */
        suggestions: Suggestion[],
        /** Additional data context to be used by the formatter. */
        dataContext: Partial<TDataContext>,
    ): TOutput | TPrimitiveOutput;
}

interface FormatMethod<TInput, TOutput, TPrimitiveOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Suggestions the formatter should take note of. */
        suggestions?: Suggestion[],
        /** Additional data context the formatter might find useful. */
        dataContext?: Partial<TDataContext>,
    ): TOutput | TPrimitiveOutput;
}

interface FormatAsPrimitiveMethod<TInput, TPrimitiveOutput, TDataContext extends DataContext> {
    (
        /** Value to format. */
        value: TInput,
        /** Suggestions the formatter should take note of in addition to `primitive`. */
        suggestions?: Suggestion[],
        /** Additional data context the formatter might find useful. */
        dataContext?: Partial<TDataContext>,
    ): TPrimitiveOutput;
}

interface FormatChainDefinition<
    TInnerInput,
    TInnerOutput,
    TInnerPrimitiveInput,
    TInnerDataContext extends DataContext,
    TOuterInput,
    TOuterOutput,
    TOuterPrimitiveOutput,
    TOuterDataContext extends DataContext,
> {
    (
        /**
         * The `formatter.format` method which can be used to delegate the formatting
         * to the wrapped formatter. Delegation is simplified so if no suggestions or contextual
         * props are passed, the original ones are used instead.
         */
        delegate: FormatMethod<TInnerInput, TInnerOutput, TInnerPrimitiveInput, TInnerDataContext>,
        /** Value to format. */
        value: TOuterInput,
        /** Suggestions the formatter should take note of. */
        suggestions: Suggestion[],
        /** Additional data context the formatter might find useful. */
        dataContext: Partial<TOuterDataContext>,
    ): TOuterOutput | TOuterPrimitiveOutput;
}

type FormatterProps<TInput, TDataContext extends DataContext> = {
    /** Value to format. */
    children: TInput;
    /** Suggestions the formatter should take note of. */
    suggestions?: Suggestion[];
} & Partial<TDataContext>;

export interface Formatter<
    TInput,
    TOutput,
    TPrimitiveOutput = TOutput,
    TDataContext extends DataContext = DataContext,
> {
    /** Formatter name, useful for debugging or advanced pattern matching. */
    displayName?: string;
    /** Formats a value. */
    format: FormatMethod<TInput, TOutput, TPrimitiveOutput, TDataContext>;
    /** Formats a value with the `primitive` suggestion. */
    formatAsPrimitive: FormatAsPrimitiveMethod<TInput, TPrimitiveOutput, TDataContext>;
    /** The callee of the `wrap` method used to produce this formatter. */
    innerFormatter?: Formatter<any, any, any, any>;
    /**
     * Creates a new formatter from an existing one. Allows overriding of formatter behaviour
     * for certain values.
     */
    wrap: <
        TNextInput = TInput,
        TNextOutput = TOutput,
        TNextPrimitiveOutput = TPrimitiveOutput,
        TNextDataContext extends TDataContext = TDataContext,
    >(
        /**
         * Function used to format the value. Has the same signature as the one passed
         * to `makeFormatter`, except a `delegate` function is passed in the first position.
         * This function can be used to delegate formatting to the original (inner) formatter.
         */
        nextFormat: FormatChainDefinition<
            TInput,
            TOutput,
            TPrimitiveOutput,
            TDataContext,
            TNextInput,
            TNextOutput,
            TNextPrimitiveOutput,
            TNextDataContext
        >,
        /** New formatter options, replacing the original ones. */
        nextFormatterOptions?: FormatterOptions,
    ) => Formatter<TNextInput, TNextOutput, TNextPrimitiveOutput, TNextDataContext>;
    /**
     * Backwards-compatible way to use the formatter as a React component.
     *
     * @deprecated Since v0.6.0. Prefer using the `format` method instead.
     */
    (props: FormatterProps<TInput, TDataContext>): TOutput | TPrimitiveOutput | null;
}

/**
 * Creates a new formatter.
 *
 * @param format Function used to format the value.
 * @param formatterOptions Additional options for the formatter.
 */
export const makeFormatter = <
    TInput,
    TOutput,
    TPrimitiveOutput = TOutput,
    TDataContext extends DataContext = DataContext,
>(
    format: FormatDefinition<TInput, TOutput, TPrimitiveOutput, TDataContext>,
    formatterOptions?: FormatterOptions,
): Formatter<TInput, TOutput, TPrimitiveOutput, TDataContext> => {
    const formatter: Formatter<TInput, TOutput, TPrimitiveOutput, TDataContext> = props =>
        format(props.children, props.suggestions ?? [], props) ?? null;

    formatter.displayName = formatterOptions?.displayName;

    formatter.format = (value, suggestions = [], dataContext = {}) =>
        format(value, ensureFormatSuggestionIntegrity(suggestions), dataContext);

    formatter.formatAsPrimitive = (value, suggestions = [], dataContext = {}) =>
        format(
            value,
            ensureFormatAsPrimitiveSuggestionIntegrity(suggestions),
            dataContext,
        ) as TPrimitiveOutput;

    formatter.wrap = <
        TNextInput,
        TNextOutput,
        TNextPrimitiveOutput,
        TNextDataContext extends TDataContext,
    >(
        nextFormat: FormatChainDefinition<
            TInput,
            TOutput,
            TPrimitiveOutput,
            TDataContext,
            TNextInput,
            TNextOutput,
            TNextPrimitiveOutput,
            TNextDataContext
        >,
        nextFormatterOptions?: FormatterOptions,
    ) => {
        const nextFormatter = makeFormatter<
            TNextInput,
            TNextOutput,
            TNextPrimitiveOutput,
            TNextDataContext
        >((value, suggestions, dataContext) => {
            const delegate: FormatMethod<TInput, TOutput, TPrimitiveOutput, TDataContext> = (
                delegatedValue,
                delegatedSuggestions,
                delegatedDataContext,
            ) =>
                formatter.format(
                    delegatedValue,
                    delegatedSuggestions ?? suggestions,
                    delegatedDataContext ?? dataContext,
                );

            return nextFormat(delegate, value, suggestions, dataContext);
        }, nextFormatterOptions ?? formatterOptions);

        nextFormatter.innerFormatter = formatter;

        return nextFormatter;
    };

    return formatter;
};
