import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { WithSuiteSyncAndDeviceState, selectSuiteSyncInteraction } from '@suite-common/suite-sync';
import { Banner } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { suiteSyncErrorHandler } from '../../labeling/suiteSyncErrorHandler';

type SuiteSyncBannerProps = {
    deviceStaticSessionId: StaticSessionId;
};

const SuiteSyncKeysBannerContent = ({
    deviceStaticSessionId,
}: {
    deviceStaticSessionId: StaticSessionId;
}) => {
    const dispatch = useDispatch();
    const { suiteSync } = useSuiteServices();

    const handleGetKeys = async () => {
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
    };

    return (
        <Banner
            icon
            intent="info"
            rightContent={
                <Banner.Button
                    onClick={handleGetKeys}
                    data-testid="@notification/suite-sync-keys/button"
                >
                    <Translation id="TR_SUITE_SYNC_GET_KEYS" />
                </Banner.Button>
            }
            description={<Translation id="TR_SUITE_SYNC_KEYS_NEEDED_BANNER" />}
        />
    );
};

const SuiteSyncFirmwareUpgradeBannerContent = () => {
    const dispatch = useDispatch();

    const handleUpdate = () => {
        dispatch(goto('firmware-index', { params: { cancelable: true } }));
    };

    return (
        <Banner
            icon
            intent="info"
            rightContent={
                <Banner.Button
                    onClick={handleUpdate}
                    data-testid="@notification/suite-sync-firmware-upgrade/button"
                >
                    <Translation id="TR_SUITE_SYNC_FIRMWARE_UPGRADE" />
                </Banner.Button>
            }
            description={<Translation id="TR_SUITE_SYNC_FIRMWARE_UPGRADE_NEEDED_BANNER" />}
        />
    );
};

export const SuiteSyncBanner = ({ deviceStaticSessionId }: SuiteSyncBannerProps) => {
    const suiteSyncInteraction = useSelector((state: WithSuiteSyncAndDeviceState) =>
        selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );

    switch (suiteSyncInteraction) {
        case 'keys-needed':
            return <SuiteSyncKeysBannerContent deviceStaticSessionId={deviceStaticSessionId} />;
        case 'firmware-upgrade-needed':
            return <SuiteSyncFirmwareUpgradeBannerContent />;
    }
};
