export type TradingFormMetadata = {
    maxSpendableAmount: string | undefined;
};

export type TradingFormWithMetadata<TForm> = TForm & {
    metadata: TradingFormMetadata;
};
