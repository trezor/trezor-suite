export type HomeScreenState =
    | 'emptyPortfolioCrossroads'
    | 'emptyPortfolioTracker'
    | 'uninitializedDevice'
    | 'deviceChecksRequired'
    | 'firmwareUpdateRequired'
    | 'noNetworkConfigured'
    | 'discoveryNotFinished'
    | 'portfolioContent';
