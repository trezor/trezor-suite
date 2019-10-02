export const getLocalCurrency = (localCurrency: string) => {
    return {
        value: localCurrency,
        label: localCurrency.toUpperCase(),
    };
};
