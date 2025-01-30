export function shouldAttemptToLoadNextPageForVisibleTransactions({
    totalNumberOfTransactions,
    currentNumberOfTransactions,
    currentNumberOfVisibleTransactions,
    perPage,
    numberOfPagesRequested,
}: {
    totalNumberOfTransactions: number;
    perPage: number;
    currentNumberOfTransactions: number;
    currentNumberOfVisibleTransactions: number;
    numberOfPagesRequested: number;
}): boolean {
    if (totalNumberOfTransactions === 0) return false;
    if (currentNumberOfTransactions === totalNumberOfTransactions) return false;

    const requestedNumberOfVisibleItems = numberOfPagesRequested * perPage;
    if (requestedNumberOfVisibleItems > Math.ceil(totalNumberOfTransactions / perPage) * perPage)
        return false;

    if (currentNumberOfTransactions === 0 && totalNumberOfTransactions > 0) return true;

    if (requestedNumberOfVisibleItems > currentNumberOfVisibleTransactions) return true;

    const pagesByVisibleTransactions = Math.ceil(currentNumberOfVisibleTransactions / perPage);

    if (pagesByVisibleTransactions === 0 && totalNumberOfTransactions > 0) return true;

    return false;
}
