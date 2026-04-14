import { AnimatePresence } from 'framer-motion';

import { UpdateNotificationBanner } from '@suite/desktop-update';
import { FeedbackFormManager } from '@suite/feature-feedback';

import { SuiteSyncPromoBanner } from 'src/components/suite/labeling/SuiteSyncPromoBanner';

export const SidebarBanners = () => (
    <AnimatePresence>
        <UpdateNotificationBanner />
        <SuiteSyncPromoBanner />
        <FeedbackFormManager />
    </AnimatePresence>
);
