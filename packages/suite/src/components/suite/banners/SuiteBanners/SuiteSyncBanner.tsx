import { useSelector } from 'react-redux';

import { Translation, TranslationKey } from '@suite/intl';
import { selectIsDeviceConnected } from '@suite-common/device';
import {
    WithSuiteSyncAndDeviceState,
    selectHasDeviceSuiteSyncError,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { Banner, Tooltip } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';

import { goto } from 'src/actions/suite/routerActions';
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

type SuiteSyncBannerProps = {
    deviceStaticSessionId: StaticSessionId;
};

type SuiteSyncBannerContentProps = {
    config: BannerConfig;
    isDeviceConnected: boolean;
    onClick: () => void | Promise<void>;
};

const SuiteSyncBannerContent = ({
    config,
    isDeviceConnected,
    onClick,
}: SuiteSyncBannerContentProps) => (
    <Banner
        icon
        intent="info"
        rightContent={
            <Tooltip
                content={
                    !isDeviceConnected ? (
                        <Translation id="TR_SUITE_SYNC_CONNECT_DEVICE_TOOLTIP" />
                    ) : undefined
                }
            >
                <Banner.Button
                    isDisabled={!isDeviceConnected}
                    onClick={onClick}
                    data-testid={`${config.testId}/button`}
                >
                    <Translation id={config.buttonLabel} />
                </Banner.Button>
            </Tooltip>
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
    const suiteSyncInteraction = useSelector((state: WithSuiteSyncAndDeviceState) =>
        selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    if (
        !hasSuiteSyncError ||
        suiteSyncInteraction === null ||
        !isBannerInteraction(suiteSyncInteraction)
    ) {
        return null;
    }

    const config = bannerConfigs[suiteSyncInteraction];

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
            dispatch(goto('firmware-index', { params: { cancelable: true } }));
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
