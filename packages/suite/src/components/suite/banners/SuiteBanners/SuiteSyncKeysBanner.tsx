import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';

import { useDispatch } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { suiteSyncErrorHandler } from '../../labeling/suiteSyncErrorHandler';

type SuiteSyncKeysBannerProps = {
    deviceStaticSessionId: StaticSessionId;
};

export const SuiteSyncKeysBanner = ({ deviceStaticSessionId }: SuiteSyncKeysBannerProps) => {
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
