import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectIsDeviceConnected } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type WithSuiteSyncAndDeviceState,
    selectHasDeviceSuiteSyncError,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { selectEnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types';
import { Banner } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { XIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';

import { suiteSyncErrorHandler } from './suiteSyncErrorHandler';
import {
    dismissUnsupportedDeviceBanner,
    selectIsUnsupportedDeviceBannerDismissed,
} from './suiteSyncSlice';

type SuiteSyncBannerProps = {
    deviceStaticSessionId: StaticSessionId;
};

export const SuiteSyncBanner = ({ deviceStaticSessionId }: SuiteSyncBannerProps) => {
    const dispatch = useDispatch();

    const { ensureWalletSuiteSyncOn } = useServices(selectEnsureWalletSuiteSyncOnDep);

    const hasSuiteSyncError = useSelector((state: WithSuiteSyncAndDeviceState) =>
        selectHasDeviceSuiteSyncError(state, deviceStaticSessionId),
    );
    const suiteSyncInteraction = useSelector(
        (state: WithSuiteSyncAndDeviceState & MessageSystemRootState) =>
            selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );
    const isUnsupportedDeviceBannerDismissed = useSelector(
        selectIsUnsupportedDeviceBannerDismissed,
    );
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    if (
        !hasSuiteSyncError ||
        suiteSyncInteraction === null ||
        suiteSyncInteraction === 'suite-sync-off'
    ) {
        return null;
    }

    switch (suiteSyncInteraction) {
        case 'keys-needed': {
            const handleClick = async () => {
                const result = await ensureWalletSuiteSyncOn({
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
            };

            return (
                <Banner
                    icon
                    intent="info"
                    rightContent={
                        isDeviceConnected && (
                            <Banner.Button
                                onClick={handleClick}
                                data-testid="@notification/suite-sync-keys/button"
                            >
                                <Translation id="TR_SUITE_SYNC_GET_KEYS" />
                            </Banner.Button>
                        )
                    }
                    data-testid="@notification/suite-sync-keys"
                    description={
                        <Translation
                            id={
                                isDeviceConnected
                                    ? 'TR_SUITE_SYNC_KEYS_NEEDED_BANNER'
                                    : 'TR_SUITE_SYNC_KEYS_NEEDED_CONNECT_DEVICE_BANNER'
                            }
                        />
                    }
                />
            );
        }

        case 'firmware-upgrade-needed':
            return (
                <Banner
                    icon
                    intent="info"
                    rightContent={
                        isDeviceConnected && (
                            <Banner.Button
                                onClick={() =>
                                    dispatch(
                                        gotoThunk({
                                            routeName: 'firmware-index',
                                            params: { cancelable: true },
                                        }),
                                    )
                                }
                                data-testid="@notification/suite-sync-firmware-update/button"
                            >
                                <Translation id="TR_SUITE_SYNC_FIRMWARE_UPDATE" />
                            </Banner.Button>
                        )
                    }
                    data-testid="@notification/suite-sync-firmware-update"
                    description={<Translation id="TR_SUITE_SYNC_FIRMWARE_UPDATE_NEEDED_BANNER" />}
                />
            );

        case 'unsupported':
            if (isUnsupportedDeviceBannerDismissed) {
                return null;
            }

            return (
                <Banner
                    icon
                    intent="info"
                    rightContent={
                        <Banner.IconButton
                            icon={XIcon}
                            onClick={() => dispatch(dismissUnsupportedDeviceBanner())}
                            data-testid="@notification/suite-sync-unsupported-device/dismiss"
                            tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                        />
                    }
                    data-testid="@notification/suite-sync-unsupported-device"
                    description={<Translation id="TR_SUITE_SYNC_UNSUPPORTED_DEVICE_BANNER" />}
                />
            );

        default:
            return exhaustive(suiteSyncInteraction);
    }
};
