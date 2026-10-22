import { Text, VStack } from '@suite-native/atoms';
import { type HttpsUrl } from '@trezor/type-utils';

import { AppsCatalogCards } from './AppsCatalogCards';
import { CustomUrlInput } from './CustomUrlInput/CustomUrlInput';
import { EmbeddingModeSwitch } from './EmbeddingModeSwitch';
import { type EmbeddingMode } from '../../hooks/useAppsEmbeddingShowcase';

const PLATFORM_NOTES: Record<EmbeddingMode, string> = {
    webView:
        "Sites render in a react-native-webview. Unless the entry persists its session, iOS gives every opening a fresh in-memory store, while Android can only clear cookies (Suite's own included), cache, history and form data up front, so web storage survives between openings there; a persisting entry keeps its data in the app's default store, shared with every other persisting entry. As on desktop, the main frame may only navigate within the origin it was opened with and the origins the entry whitelists: anything else, links into other apps included, is blocked and logged instead of being handed to the OS. Android asks the guard only about top-level http(s) GET navigations and reports POST navigations only once they land, so such a page is taken back. Popups are denied and logged, location is off, and camera and microphone are denied on both platforms (on Android through Suite's patch of react-native-webview). Android saves downloads to the device. Messages the site posts through window.ReactNativeWebView.postMessage show up in the log.",
    webBrowser:
        "Sites open in the system browser on top of the app, with the browser's own storage, navigation and popups: SFSafariViewController on iOS — an ephemeral ASWebAuthenticationSession for an entry that does not persist its session — and Chrome Custom Tabs on Android, which keep Chrome's profile whatever the entry says. Suite sees none of it: the log shows only the browser opening (Android) or being closed (iOS), and the ephemeral session also reports the trezorsuite:// navigation that ends it.",
};

type AppsEmbeddingCatalogProps = {
    embedMode: EmbeddingMode;
    onEmbedModeChange: (mode: EmbeddingMode) => void;
    selectedEntryId: string | undefined;
    onOpenCatalogEntry: (entryId: string) => void;
    onOpenCustomUrl: (url: HttpsUrl) => void;
};

export const AppsEmbeddingCatalog = ({
    embedMode,
    onEmbedModeChange,
    selectedEntryId,
    onOpenCatalogEntry,
    onOpenCustomUrl,
}: AppsEmbeddingCatalogProps) => (
    <VStack spacing="sp16">
        <EmbeddingModeSwitch embedMode={embedMode} onChange={onEmbedModeChange} />
        <Text variant="body-sm" color="contentSecondary">
            {PLATFORM_NOTES[embedMode]}
        </Text>
        <Text variant="headline-sm">Catalog</Text>
        <AppsCatalogCards selectedEntryId={selectedEntryId} onSelect={onOpenCatalogEntry} />
        <CustomUrlInput onSubmit={onOpenCustomUrl} />
    </VStack>
);
