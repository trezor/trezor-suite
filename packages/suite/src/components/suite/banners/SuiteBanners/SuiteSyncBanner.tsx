import { useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { goto } from '@suite/router';
import { selectIsDeviceConnected } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectHasDeviceSuiteSyncError,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { Banner } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';

import { useDispatch } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { suiteSyncErrorHandler } from '../../labeling/suiteSyncErrorHandler';

type BannerConfig = {
    testId: string;
    buttonLabel: TranslationKey;
    description: TranslationKey;
};

type SuiteSyncBannerInteraction = 'keys-needed' | 'firmware-upgrade-needed';

const bannerConfigs: Record<SuiteSyncBannerInteraction, BannerConfig> = {
    'keys-needed': {
        testId: '@notification/suite-sync-keys',
        buttonLabel: 'TR_SUITE_SYNC_GET_KEYS',
        description: 'TR_SUITE_SYNC_KEYS_NEEDED_BANNER',
    },
    'firmware-upgrade-needed': {
        testId: '@notification/suite-sync-firmware-update',
        buttonLabel: 'TR_SUITE_SYNC_FIRMWARE_UPDATE',
        description: 'TR_SUITE_SYNC_FIRMWARE_UPDATE_NEEDED_BANNER',
    },
};

const isBannerInteraction = (interaction: string): interaction is SuiteSyncBannerInteraction =>
    interaction in bannerConfigs;

const getBannerConfig = ({
    interaction,
    isDeviceConnected,
}: {
    interaction: SuiteSyncBannerInteraction;
    isDeviceConnected: boolean;
}): BannerConfig => {
    if (interaction === 'keys-needed' && !isDeviceConnected) {
        return {
            testId: '@notification/suite-sync-keys',
            buttonLabel: 'TR_SUITE_SYNC_CONNECT_AND_GET_KEYS',
            description: 'TR_SUITE_SYNC_KEYS_NEEDED_CONNECT_DEVICE_BANNER',
        };
    }

    return bannerConfigs[interaction];
};

type SuiteSyncBannerProps = {
    deviceStaticSessionId: StaticSessionId;
};

const SuiteSyncBannerContent = ({
    config,
    isDeviceConnected,
    onClick,
}: {
    config: BannerConfig;
    isDeviceConnected: boolean;
    onClick: () => void | Promise<void>;
}) => (
    <Banner
        icon
        intent="info"
        rightContent={
            isDeviceConnected && (
                <Banner.Button onClick={onClick} data-testid={`${config.testId}/button`}>
                    <Translation id={config.buttonLabel} />
                </Banner.Button>
            )
        }
        data-testid={config.testId}
        description={<Translation id={config.description} />}
    />
);

export const SuiteSyncBanner = ({ deviceStaticSessionId }: SuiteSyncBannerProps) => {
    const dispatch = useDispatch();
    const { suiteSync } = useSuiteServices();

    const hasSuiteSyncError = useSelector((state: WithSuiteSyncAndDeviceState) =>
        selectHasDeviceSuiteSyncError(state, deviceStaticSessionId),
    );
    const suiteSyncInteraction = useSelector(
        (state: WithSuiteSyncAndDeviceState & MessageSystemRootState) =>
            selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    if (!hasSuiteSyncError || !suiteSyncInteraction || !isBannerInteraction(suiteSyncInteraction)) {
        return null;
    }

    const config = getBannerConfig({
        interaction: suiteSyncInteraction,
        isDeviceConnected,
    });

    const handlers: Record<SuiteSyncBannerInteraction, () => void | Promise<void>> = {
        'keys-needed': async () => {
            const result = await suiteSync.ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
                isWriteMode: false,
            });

            if (!result.success) {
                suiteSyncErrorHandler({
                    error: result.error,
                    dispatch,
                    deviceStaticSessionId,
                });
            }
        },
        'firmware-upgrade-needed': () => {
            dispatch(goto({ routeName: 'firmware-index', params: { cancelable: true } }));
        },
    };

    return (
        <SuiteSyncBannerContent
            config={config}
            isDeviceConnected={isDeviceConnected}
            onClick={handlers[suiteSyncInteraction]}
        />
    );
};
