import {
    type GraphFiatResolution,
    type GraphFiatResolutionEntry,
} from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

export const getGraphFiatEntryKey = ({
    baseCurrencyCode,
    coinId,
    resolution,
}: {
    baseCurrencyCode: BaseCurrencyCode;
    coinId: string;
    resolution: GraphFiatResolution;
}) => `${coinId}:${baseCurrencyCode}:${resolution}`;

export const isGraphFiatEntryForBaseCurrency = (key: string, baseCurrencyCode: BaseCurrencyCode) =>
    key.split(':').at(-2) === baseCurrencyCode;

export const createEmptyGraphFiatResolutionEntry = (): GraphFiatResolutionEntry => ({
    points: [],
    fetchedAt: null,
    failedAt: null,
    lastPointTimestamp: null,
    isLoading: false,
    error: null,
});

const emptyGraphFiatResolutionEntry = createEmptyGraphFiatResolutionEntry();

export const getEmptyGraphFiatResolutionEntry = (): GraphFiatResolutionEntry =>
    emptyGraphFiatResolutionEntry;
