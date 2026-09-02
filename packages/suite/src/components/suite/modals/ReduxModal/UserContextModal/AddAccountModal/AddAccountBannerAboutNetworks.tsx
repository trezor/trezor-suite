import { AnimatePresence, motion } from 'framer-motion';

import { selectIsAddAccountNetworksBannerClosed, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';
import { GraduationCapIcon } from '@trezor/icons';

import { bannerAnimationConfig } from 'src/components/suite/modals/ReduxModal/UserContextModal/ActivateAssetsModal';
import { useSelector } from 'src/hooks/suite';

const AddAccountBannerAboutNetworksInner = () => {
    const dispatch = useDispatch();
    const closeNetworkInfoBanner = () => {
        dispatch(setFlag({ key: 'addAccountNetworksBannerClosed', value: true }));
    };

    return (
        <Banner
            intent="neutral"
            margin={{ bottom: 12 }}
            icon={GraduationCapIcon}
            title={<Translation id="TR_ADD_ACCOUNT_NETWORKS_BANNER_TITLE" />}
            description={<Translation id="TR_ADD_ACCOUNT_NETWORKS_BANNER_DESCRIPTION" />}
            rightContent={
                <Banner.Button
                    size="small"
                    onClick={closeNetworkInfoBanner}
                    data-testid="@modal/account/networks-banner-dismiss"
                >
                    <Translation id="TR_OK_GOT_IT" />
                </Banner.Button>
            }
            data-testid="@modal/account/networks-banner"
        />
    );
};

export const AddAccountBannerAboutNetworks = () => {
    const isAddAccountNetworksBannerClosed = useSelector(selectIsAddAccountNetworksBannerClosed);

    return (
        <AnimatePresence>
            {!isAddAccountNetworksBannerClosed ? (
                <motion.div {...bannerAnimationConfig}>
                    <AddAccountBannerAboutNetworksInner />
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
};
