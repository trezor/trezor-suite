import { Text, VStack } from '@suite-native/atoms';
import { type HttpsUrl } from '@trezor/type-utils';

import { AppsCatalogCards } from './AppsCatalogCards';
import { CustomUrlInput } from './CustomUrlInput/CustomUrlInput';
import { EmbeddingModeSwitch } from './EmbeddingModeSwitch';
import { type EmbeddingMode } from '../../hooks/useAppsEmbeddingShowcase';

const PLATFORM_NOTES: Record<EmbeddingMode, string> = {
    webView:
        "Sites render in a react-native-webview without a persistent session: iOS gives every opening a fresh in-memory store, while Android can only clear cookies (Suite's own included), cache, history and form data, so web storage survives between openings there. As on desktop, the main frame may only navigate within the origin it was opened with: anything else, links into other apps included, is blocked and logged instead of being handed to the OS. Android cannot tell frames apart, so iframe navigations may hit the same rule there, and it reports POST navigations only once they land, so such a page is taken back. Popups are denied and logged, location is off, and iOS denies camera and microphone. Android WebView grants the camera whenever Suite holds the permission and asks for it otherwise, and it saves downloads to the device. Messages the site posts through window.ReactNativeWebView.postMessage show up in the log.",
    webBrowser:
        "Sites open in the system browser (SFSafariViewController / Chrome Custom Tabs) on top of the app, with the browser's own storage, navigation and popups. Suite sees none of it: the log shows only the browser opening (Android) or being closed (iOS).",
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
