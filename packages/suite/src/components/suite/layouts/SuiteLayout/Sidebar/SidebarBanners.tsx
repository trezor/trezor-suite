import { AnimatePresence } from 'framer-motion';

import { UpdateNotificationBanner } from '@suite/desktop-update';
import { FeedbackFormManager } from '@suite/feature-feedback';
import { SuiteSyncPromoBanner } from '@suite/metadata-migration';
import { Column, ElevationContext } from '@trezor/components';

import { useSuiteServices } from 'src/support/SuiteServicesProvider';

export const SidebarBanners = () => {
    const { suiteSync } = useSuiteServices();

    return (
        <AnimatePresence>
            <ElevationContext baseElevation={0}>
                <Column gap={12} padding={12}>
                    <UpdateNotificationBanner />
                    <SuiteSyncPromoBanner suiteSync={suiteSync} />
                    <FeedbackFormManager />
                </Column>
            </ElevationContext>
        </AnimatePresence>
    );
};
