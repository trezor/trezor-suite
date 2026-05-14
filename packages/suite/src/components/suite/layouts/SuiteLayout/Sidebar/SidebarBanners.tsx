import { AnimatePresence } from 'framer-motion';

import { UpdateNotificationBanner } from '@suite/desktop-update';
import { FeedbackFormManager } from '@suite/feature-feedback';
import { Column, ElevationContext } from '@trezor/components';

import { SuiteSyncPromoBanner } from 'src/components/suite/labeling/SuiteSyncPromoBanner';

export const SidebarBanners = () => (
    <AnimatePresence>
        <ElevationContext baseElevation={0}>
            <Column gap={12} padding={12}>
                <UpdateNotificationBanner />
                <SuiteSyncPromoBanner />
                <FeedbackFormManager />
            </Column>
        </ElevationContext>
    </AnimatePresence>
);
