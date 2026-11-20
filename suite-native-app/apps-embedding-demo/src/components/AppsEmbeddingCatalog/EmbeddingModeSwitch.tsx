import { Button, HStack } from '@suite-native/atoms';

import { type EmbeddingMode } from '../../hooks/useAppsEmbeddingShowcase';

type EmbeddingModeSwitchProps = {
    embedMode: EmbeddingMode;
    onChange: (mode: EmbeddingMode) => void;
};

export const EmbeddingModeSwitch = ({ embedMode, onChange }: EmbeddingModeSwitchProps) => (
    <HStack spacing="sp8">
        <Button
            size="small"
            intent="neutral"
            priority={embedMode === 'webView' ? 'primary' : 'secondary'}
            onPress={() => onChange('webView')}
            testID="@dev-utils/apps-embedding/mode-webview"
        >
            WebView
        </Button>
        <Button
            size="small"
            intent="neutral"
            priority={embedMode === 'webBrowser' ? 'primary' : 'secondary'}
            onPress={() => onChange('webBrowser')}
            testID="@dev-utils/apps-embedding/mode-webbrowser"
        >
            WebBrowser
        </Button>
    </HStack>
);
