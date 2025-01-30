import { shouldAttemptToLoadNextPageForVisibleTransactions } from '../transaction-fetch-utils';

describe('TransactionFetchUtils', () => {
    it('should request fetching because the current number of visible transaction is 0 and there are still available', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 100,
            currentNumberOfTransactions: 0,
            currentNumberOfVisibleTransactions: 0,
            perPage: 25,
            numberOfPagesRequested: 0,
        });

        expect(result).toBe(true);
    });

    it('should request fetching because there are still pages a available even though many transactions were filtered', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 100,
            currentNumberOfTransactions: 25,
            currentNumberOfVisibleTransactions: 0,
            perPage: 25,
            numberOfPagesRequested: 1,
        });

        expect(result).toBe(true);
    });

    it("should request fetching because the number of visible pages won't fit even one page", () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 100,
            currentNumberOfTransactions: 25,
            currentNumberOfVisibleTransactions: 10,
            perPage: 25,
            numberOfPagesRequested: 1,
        });

        expect(result).toBe(true);
    });

    it('should NOT request fetching because the number of visible pages will fit even one page', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 100,
            currentNumberOfTransactions: 25,
            currentNumberOfVisibleTransactions: 25,
            perPage: 25,
            numberOfPagesRequested: 1,
        });

        expect(result).toBe(false);
    });

    it('should request fetching because there is too little number of page for 2 pages', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 100,
            currentNumberOfTransactions: 50,
            currentNumberOfVisibleTransactions: 40,
            perPage: 25,
            numberOfPagesRequested: 2,
        });

        expect(result).toBe(true);
    });

    it('should request fetching because there is too little number of page for 3 pages', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 100,
            currentNumberOfTransactions: 75,
            currentNumberOfVisibleTransactions: 50,
            perPage: 25,
            numberOfPagesRequested: 3,
        });

        expect(result).toBe(true);
    });

    it('should NOT request fetching any more pages because there are not any left', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 100,
            currentNumberOfTransactions: 100,
            currentNumberOfVisibleTransactions: 2,
            perPage: 25,
            numberOfPagesRequested: 1,
        });

        expect(result).toBe(false);
    });

    it('should NOT request fetching any more pages since there is enough of visible transactions already', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 130,
            currentNumberOfTransactions: 75,
            currentNumberOfVisibleTransactions: 58,
            perPage: 25,
            numberOfPagesRequested: 2,
        });

        expect(result).toBe(false);
    });

    it('should NOT request fetching any more pages since there are no transactions', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 0,
            currentNumberOfTransactions: 0,
            currentNumberOfVisibleTransactions: 0,
            perPage: 25,
            numberOfPagesRequested: 1,
        });
        expect(result).toBe(false);
    });

    it('should request fetching when there is more more data to be loaded', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 22,
            currentNumberOfTransactions: 20,
            currentNumberOfVisibleTransactions: 20,
            perPage: 5,
            numberOfPagesRequested: 5,
        });
        expect(result).toBe(true);
    });

    it('should NOT request fetching when there is no more data to be loaded', () => {
        const result = shouldAttemptToLoadNextPageForVisibleTransactions({
            totalNumberOfTransactions: 22,
            currentNumberOfTransactions: 20,
            currentNumberOfVisibleTransactions: 20,
            perPage: 5,
            numberOfPagesRequested: 6,
        });
        expect(result).toBe(false);
    });
});
