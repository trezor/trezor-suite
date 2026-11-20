import { type TranslationKey } from '@suite/intl';

import { type DiscoveryStage } from './useDiscoveryIllustration';

type CaptionLines = [lead: TranslationKey, ...lines: TranslationKey[]];

type DiscoveryCaptions = [first: CaptionLines, ...rest: CaptionLines[]];

/**
 * The captions the loader rotates through, or with reduced motion the one that tells it all.
 * Each line must stay true to what discovery does. The account birthday lookup before the scan
 * sends receive address #0, so no line may claim that addresses never leave this computer.
 */
export const getDiscoveryCaptions = (
    stage: DiscoveryStage,
    isReducedMotion: boolean,
): DiscoveryCaptions => {
    const local =
        stage === 'block'
            ? 'TR_COINJOIN_DISCOVERY_CAPTION_BLOCKS_LOCAL'
            : 'TR_COINJOIN_DISCOVERY_CAPTION_MEMPOOL_LOCAL';

    if (isReducedMotion) {
        return [
            [
                local,
                'TR_COINJOIN_DISCOVERY_CAPTION_FILTERS_OVER_TOR',
                'TR_COINJOIN_DISCOVERY_CAPTION_DISCARD',
                'TR_COINJOIN_DISCOVERY_CAPTION_FETCH',
                'TR_COINJOIN_DISCOVERY_CAPTION_KEEP',
            ],
        ];
    }

    return [
        [local, 'TR_COINJOIN_DISCOVERY_CAPTION_FILTERS_OVER_TOR'],
        ['TR_COINJOIN_DISCOVERY_CAPTION_DISCARD', 'TR_COINJOIN_DISCOVERY_CAPTION_FETCH'],
        ['TR_COINJOIN_DISCOVERY_CAPTION_SERVER', 'TR_COINJOIN_DISCOVERY_CAPTION_KEEP'],
    ];
};
