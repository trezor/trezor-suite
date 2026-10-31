import { type TranslationKey } from '@suite/intl';

import { type DiscoveryStage } from './PrivacyIllustration/createLoaderArt';

export type CaptionId =
    | 'blocksLocal'
    | 'mempoolLocal'
    | 'discard'
    | 'server'
    | 'fetchBlocks'
    | 'fetchTransactions'
    | 'keep'
    | 'chance';

export type LegendIconType = 'local' | 'discard' | 'circuit' | 'keep' | 'keepUnconfirmed';

type CaptionCopy = { lead: TranslationKey; detail: TranslationKey };

type LegendItem = { icon: LegendIconType; text: TranslationKey };

// Every line must stay true to what discovery does: e.g. the account birthday lookup before the scan
// sends receive address #0, so no line may claim that addresses never leave this computer.
export const CAPTION_COPY: Record<CaptionId, CaptionCopy> = {
    blocksLocal: {
        lead: 'TR_COINJOIN_DISCOVERY_CAPTION_BLOCKS_LOCAL',
        detail: 'TR_COINJOIN_DISCOVERY_CAPTION_FILTERS_OVER_TOR',
    },
    mempoolLocal: {
        lead: 'TR_COINJOIN_DISCOVERY_CAPTION_MEMPOOL_LOCAL',
        detail: 'TR_COINJOIN_DISCOVERY_CAPTION_FILTERS_OVER_TOR',
    },
    discard: {
        lead: 'TR_COINJOIN_DISCOVERY_CAPTION_DISCARD',
        detail: 'TR_COINJOIN_DISCOVERY_CAPTION_DISCARD_DETAIL',
    },
    server: {
        lead: 'TR_COINJOIN_DISCOVERY_CAPTION_SERVER',
        detail: 'TR_COINJOIN_DISCOVERY_CAPTION_SERVER_DETAIL',
    },
    fetchBlocks: {
        lead: 'TR_COINJOIN_DISCOVERY_CAPTION_FETCH',
        detail: 'TR_COINJOIN_DISCOVERY_CAPTION_FETCH_BLOCKS',
    },
    fetchTransactions: {
        lead: 'TR_COINJOIN_DISCOVERY_CAPTION_FETCH',
        detail: 'TR_COINJOIN_DISCOVERY_CAPTION_FETCH_TRANSACTIONS',
    },
    keep: {
        lead: 'TR_COINJOIN_DISCOVERY_CAPTION_KEEP',
        detail: 'TR_COINJOIN_DISCOVERY_CAPTION_KEEP_DETAIL',
    },
    chance: {
        lead: 'TR_COINJOIN_DISCOVERY_CAPTION_CHANCE',
        detail: 'TR_COINJOIN_DISCOVERY_CAPTION_CHANCE_DETAIL',
    },
};

export const CAPTION_ROTATION: Record<DiscoveryStage, CaptionId[]> = {
    block: ['blocksLocal', 'discard', 'server'],
    mempool: ['mempoolLocal', 'server', 'discard'],
};

// With reduced motion the caption leads double as a legend of the still illustration.
export const LEGEND_ITEMS: Record<DiscoveryStage, LegendItem[]> = {
    block: [
        { icon: 'local', text: 'TR_COINJOIN_DISCOVERY_CAPTION_BLOCKS_LOCAL' },
        { icon: 'discard', text: 'TR_COINJOIN_DISCOVERY_CAPTION_DISCARD' },
        { icon: 'circuit', text: 'TR_COINJOIN_DISCOVERY_CAPTION_FETCH' },
        { icon: 'keep', text: 'TR_COINJOIN_DISCOVERY_CAPTION_KEEP' },
    ],
    mempool: [
        { icon: 'local', text: 'TR_COINJOIN_DISCOVERY_CAPTION_MEMPOOL_LOCAL' },
        { icon: 'discard', text: 'TR_COINJOIN_DISCOVERY_CAPTION_DISCARD' },
        { icon: 'circuit', text: 'TR_COINJOIN_DISCOVERY_CAPTION_FETCH' },
        { icon: 'keepUnconfirmed', text: 'TR_COINJOIN_DISCOVERY_CAPTION_KEEP' },
    ],
};

// The illustration's accessible description, read as one text.
export const ILLUSTRATION_DESCRIPTION: Record<DiscoveryStage, TranslationKey[]> = {
    block: [
        'TR_COINJOIN_DISCOVERY_CAPTION_BLOCKS_LOCAL',
        'TR_COINJOIN_DISCOVERY_CAPTION_FILTERS_OVER_TOR',
        'TR_COINJOIN_DISCOVERY_CAPTION_FETCH',
        'TR_COINJOIN_DISCOVERY_CAPTION_FETCH_BLOCKS',
    ],
    mempool: [
        'TR_COINJOIN_DISCOVERY_CAPTION_MEMPOOL_LOCAL',
        'TR_COINJOIN_DISCOVERY_CAPTION_FILTERS_OVER_TOR',
        'TR_COINJOIN_DISCOVERY_CAPTION_FETCH',
        'TR_COINJOIN_DISCOVERY_CAPTION_FETCH_TRANSACTIONS',
    ],
};
