import { useState } from 'react';

import { AnimatePresence } from 'framer-motion';

import {
    UpdateNotificationBanner,
    selectShouldShowUpdateNotificationBanner,
} from '@suite/desktop-update';
import {
    FeedbackFormManager,
    selectShouldShowFeedbackSidebarBanner,
} from '@suite/feature-feedback';
import {
    SuiteSyncPromoBanner,
    selectShouldShowSuiteSyncPromoBanner,
} from '@suite/metadata-migration';
import { useSelector } from '@suite-common/redux-utils';
import { Box } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import {
    NoDeviceEshopSidebarBanner,
    selectShouldShowNoDeviceEshopSidebarBanner,
} from './NoDeviceEshopSidebarBanner';

export const SidebarBanners = () => {
    const [isUpdateBannerVisible, setIsUpdateBannerVisible] = useState(true);
    const [isSuiteSyncPromoBannerVisible, setIsSuiteSyncPromoBannerVisible] = useState(true);

    const shouldShowUpdateBanner = useSelector(selectShouldShowUpdateNotificationBanner);
    const shouldShowFeedbackBanner = useSelector(selectShouldShowFeedbackSidebarBanner);
    const shouldShowSuiteSyncPromoBanner = useSelector(selectShouldShowSuiteSyncPromoBanner);
    const shouldShowNoDeviceEshopBanner = useSelector(selectShouldShowNoDeviceEshopSidebarBanner);

    const getActiveSidebarBanner = () => {
        if (shouldShowUpdateBanner && isUpdateBannerVisible) {
            return <UpdateNotificationBanner onDismiss={() => setIsUpdateBannerVisible(false)} />;
        }

        if (shouldShowSuiteSyncPromoBanner && isSuiteSyncPromoBannerVisible) {
            return (
                <SuiteSyncPromoBanner onDismiss={() => setIsSuiteSyncPromoBannerVisible(false)} />
            );
        }

        if (shouldShowNoDeviceEshopBanner) {
            return <NoDeviceEshopSidebarBanner />;
        }

        if (shouldShowFeedbackBanner) {
            return <FeedbackFormManager />;
        }

        return null;
    };

    const banner = getActiveSidebarBanner();

    if (!banner) {
        return null;
    }

    return (
        <AnimatePresence>
            <Box
                padding={12}
                minWidth={280}
                position={{ type: 'relative' }}
                zIndex={zIndices.popover}
            >
                {banner}
            </Box>
        </AnimatePresence>
    );
};
