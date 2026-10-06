import {
    AppsEmbeddingShowcase,
    selectIsAppsEmbeddingAvailable,
    useAppsEmbeddingShowcase,
} from '@suite/apps-embedding-demo';
import { Banner } from '@trezor/components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout, usePreferredModal, useSelector } from 'src/hooks/suite';

export const AppsEmbedding = () => {
    const isAppsEmbeddingAvailable = useSelector(selectIsAppsEmbeddingAvailable);
    const showcase = useAppsEmbeddingShowcase();
    const preferredModal = usePreferredModal();

    // While a site is open it takes over the whole content area. That is what lets the desktop
    // host track it with a single ResizeObserver, and it is the shape the in-app browser needs.
    const isEmbedding = isAppsEmbeddingAvailable && showcase.targetUrl !== undefined;

    useLayout('Apps embedding', <PageHeader />, undefined, { isContentStatic: isEmbedding });

    // Debug mode can be turned off by a keyboard shortcut while a site is open, so the gate lives
    // here rather than only on the sidebar item: unmounting the showcase takes the site down too.
    if (!isAppsEmbeddingAvailable) {
        return (
            <Banner
                intent="warning"
                description="The apps embedding showcase needs debug mode and its switch in Debug settings turned on."
            />
        );
    }

    return <AppsEmbeddingShowcase {...showcase} isModalOpen={preferredModal.type !== 'none'} />;
};
