import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AppsEmbeddingCatalog } from './components/AppsEmbeddingCatalog/AppsEmbeddingCatalog';
import { EmbeddedAppRegion } from './components/EmbeddedAppRegion/EmbeddedAppRegion';
import { useAppsEmbeddingShowcase } from './hooks/useAppsEmbeddingShowcase';

export const AppsEmbeddingScreen = () => {
    const {
        embedMode,
        setEmbedMode,
        target,
        selectedEntry,
        logEntries,
        addEvent,
        clearEvents,
        openCatalogEntry,
        openCustomUrl,
        close,
    } = useAppsEmbeddingShowcase();

    return (
        <Screen
            // Each layout starts at the top, while the dynamic header would keep the scrolled state of
            // the one before it until the next scroll event.
            key={target === null ? 'catalog' : 'embedded-app'}
            header={
                <DynamicScreenHeader
                    title="Apps embedding"
                    subtitle="Debug-only embedding showcase"
                    isCompactOnly={target !== null}
                />
            }
            // An open site gets the rest of the screen, as on desktop: the WebView and the event log
            // scroll on their own, and inside a scrolling screen the WebView would get no height.
            isScrollable={target === null}
        >
            {target === null ? (
                <AppsEmbeddingCatalog
                    embedMode={embedMode}
                    onEmbedModeChange={setEmbedMode}
                    selectedEntryId={selectedEntry?.id}
                    onOpenCatalogEntry={openCatalogEntry}
                    onOpenCustomUrl={openCustomUrl}
                />
            ) : (
                <EmbeddedAppRegion
                    embedMode={embedMode}
                    target={target}
                    embedTitle={selectedEntry?.name ?? 'Custom URL'}
                    logEntries={logEntries}
                    onEvent={addEvent}
                    onClearEvents={clearEvents}
                    onClose={close}
                />
            )}
        </Screen>
    );
};
