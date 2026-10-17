import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { Card, Text, VStack } from '@suite-native/atoms';
import { type HttpsUrl } from '@trezor/type-utils';

import { useSystemBrowserSession } from './hooks/useSystemBrowserSession';

type EmbeddedAppWebBrowserProps = {
    targetUrl: HttpsUrl;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

// System-browser counterpart of EmbeddedAppWebView: the site runs in SFSafariViewController /
// Chrome Custom Tabs, so there is no inline viewport, no navigation guard and no postMessage.
export const EmbeddedAppWebBrowser = ({ targetUrl, onEvent }: EmbeddedAppWebBrowserProps) => {
    useSystemBrowserSession({ targetUrl, onEvent });

    return (
        <Card>
            <VStack spacing="sp8">
                <Text variant="body-md-strong">Running in the system browser</Text>
                <Text variant="body-sm" color="contentSecondary">
                    SFSafariViewController / Chrome Custom Tabs shows the page on top of the app.
                    Only the browser opening or closing is observable — check the event log below.
                </Text>
            </VStack>
        </Card>
    );
};
