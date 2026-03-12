import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Button, Switch } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';
import { GITHUB_MCP_DOCS_URL } from '@trezor/urls';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

const ConfigBox = styled.div`
    position: relative;
    background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation0};
    border-radius: 8px;
    padding: ${spacings.sm}px ${spacings.md}px;
`;

const ConfigSnippet = styled.pre`
    font-size: 13px;
    line-height: 1.5;
    overflow-x: auto;
    margin: 0;
`;

const CopyButtonWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: ${spacings.xs}px;
`;

const getConfigSnippet = (url: string) =>
    JSON.stringify({ mcpServers: { 'trezor-suite': { url } } }, null, 4);

export const McpServer = () => {
    const [settings, setSettings] = useState<{
        enabled: boolean;
        port: number;
        running: boolean;
        url: string | null;
    } | null>(null);

    useEffect(() => {
        if (desktopApi.available) {
            desktopApi.mcpGetSettings().then(setSettings);
        }
    }, []);

    const handleToggle = async () => {
        if (!desktopApi.available || !settings) return;

        const newEnabled = !settings.enabled;
        await desktopApi.mcpSetEnabled(newEnabled);

        const updated = await desktopApi.mcpGetSettings();
        setSettings(updated);
    };

    const handleCopyConfig = () => {
        if (!settings?.url) return;
        copyToClipboard(getConfigSnippet(settings.url));
    };

    if (!settings) return null;

    return (
        <>
            <SectionItem>
                <TextColumn
                    title="MCP Server"
                    description="Enable an MCP (Model Context Protocol) server that allows AI agents to interact with your Trezor device. The server runs on localhost only."
                />
                <ActionColumn>
                    <Switch isChecked={settings.enabled} onChange={handleToggle} />
                </ActionColumn>
            </SectionItem>
            {settings.enabled && settings.url && (
                <SectionItem>
                    <TextColumn
                        title="Client Configuration"
                        description="Add this to your MCP client config."
                        buttonLink={GITHUB_MCP_DOCS_URL}
                    />
                    <ActionColumn>
                        <ConfigBox>
                            <ConfigSnippet>{getConfigSnippet(settings.url)}</ConfigSnippet>
                            <CopyButtonWrapper>
                                <Button
                                    variant="tertiary"
                                    size="small"
                                    iconLeft="copy"
                                    onClick={handleCopyConfig}
                                >
                                    Copy
                                </Button>
                            </CopyButtonWrapper>
                        </ConfigBox>
                    </ActionColumn>
                </SectionItem>
            )}
        </>
    );
};
