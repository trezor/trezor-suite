export default {
    MAX_ACCOUNTS: 10,
    FRESH_ADDRESS_LIMIT: 20,
    TXS_PER_PAGE: 25,
    DEFAULT_GRAPH_RANGE: {
        label: 'all',
        startDate: null,
        endDate: null,
        groupBy: 'month',
    },
} as const;
