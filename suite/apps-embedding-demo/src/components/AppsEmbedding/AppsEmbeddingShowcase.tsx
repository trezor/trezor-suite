import { getPlatformSpecificEntry } from '@suite-common/apps-embedding';
import { Banner, Column } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { SettingsSection } from '@trezor/product-components';

import { AppsCatalog } from './AppsCatalog';
import { CustomUrlInput } from './CustomUrlInput';
import { EmbeddedAppRegion } from './EmbeddedAppRegion';
import { type UseAppsEmbeddingShowcaseResult } from './hooks/useAppsEmbeddingShowcase';

const PLATFORM_NOTE_DESKTOP =
    'Sites render in a native WebContentsView with a session of their own — the renderer CSP and request filter do not apply, and neither does Tor. Most entries forget everything when Suite closes; an entry marked as persistent instead keeps its cookies, storage and service workers in its own directory under the app data folder, unencrypted apart from what the OS keychain covers, and its popups share that session. Use "Forget data" on the catalog row to clear it. The view is painted above the DOM rather than inside it, so it is given a dedicated region and hidden while a modal is open. The postMessage channel is not bridged on desktop yet.';
const PLATFORM_NOTE_WEB =
    'Sites render in a plain iframe. The dev server sends no CSP; preview and production builds restrict frame-src, so most entries only load in development.';

type AppsEmbeddingShowcaseProps = UseAppsEmbeddingShowcaseResult & {
    isModalOpen: boolean;
};

/**
 * The showcase itself, without the page chrome around it.
 *
 * The host app owns that chrome, the modal state and the `selectIsAppsEmbeddingAvailable` gate, so
 * it holds `useAppsEmbeddingShowcase` and hands the result back down: while a site is open the
 * showcase needs the whole content area, and that is a decision only the layout above it can act on.
 */
export const AppsEmbeddingShowcase = ({
    selectedEntry,
    targetUrl,
    logEntries,
    addEvent,
    clearEvents,
    openCatalogEntry,
    openCustomUrl,
    close,
    isModalOpen,
}: AppsEmbeddingShowcaseProps) => {
    const desktopEntry = getPlatformSpecificEntry(selectedEntry, 'desktop');

    return targetUrl !== undefined ? (
        <EmbeddedAppRegion
            targetUrl={targetUrl}
            entryId={selectedEntry?.id}
            embedTitle={selectedEntry?.name ?? 'Custom URL'}
            redirectExternalOrigins={desktopEntry?.redirectExternalOrigins}
            popupExternalOrigins={desktopEntry?.popupExternalOrigins}
            webEntry={getPlatformSpecificEntry(selectedEntry, 'web')}
            logEntries={logEntries}
            onEvent={addEvent}
            onClearEvents={clearEvents}
            onClose={close}
            isModalOpen={isModalOpen}
        />
    ) : (
        <Column gap={24}>
            <Banner
                intent="info"
                description={isDesktop() ? PLATFORM_NOTE_DESKTOP : PLATFORM_NOTE_WEB}
            />
            <SettingsSection title="Catalog" hasVerticalLayout>
                <Column gap={12}>
                    <AppsCatalog selectedEntryId={selectedEntry?.id} onSelect={openCatalogEntry} />
                    <CustomUrlInput onSubmit={openCustomUrl} />
                </Column>
            </SettingsSection>
        </Column>
    );
};
