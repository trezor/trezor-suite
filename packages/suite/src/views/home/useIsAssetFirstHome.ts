import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';

export const useIsAssetFirstHome = (): boolean =>
    useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });
