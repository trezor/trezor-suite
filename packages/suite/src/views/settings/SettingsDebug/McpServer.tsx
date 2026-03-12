import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Button, Modal, Switch } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

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
    gap: ${spacings.xs}px;
    margin-top: ${spacings.xs}px;
`;

const getConfigSnippet = (url: string, token: string | null) => {
    const config: Record<string, unknown> = { url };
    if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
    }

    return JSON.stringify({ mcpServers: { 'trezor-suite': config } }, null, 4);
};

const RegenerateTokenModal = ({
    onCancel,
    onSubmit,
}: {
    onCancel: () => void;
    onSubmit: () => void;
}) => (
    <Modal
        heading="Regenerate MCP Token"
        onCancel={onCancel}
        intent="warning"
        width={600}
        bottomContent={
            <>
                <Modal.Button
                    onClick={() => {
                        onSubmit();
                        onCancel();
                    }}
                >
                    Regenerate
                </Modal.Button>
                <Modal.Button onClick={onCancel} intent="neutral" priority="secondary">
                    Cancel
                </Modal.Button>
            </>
        }
    >
        This will invalidate the current token. All connected MCP clients will be disconnected and
        you will need to update their configuration with the new token.
    </Modal>
);

export const McpServer = () => {
    const [settings, setSettings] = useState<{
        enabled: boolean;
        port: number;
        running: boolean;
        url: string | null;
        token: string | null;
    } | null>(null);
    const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

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
        copyToClipboard(getConfigSnippet(settings.url, settings.token));
    };

    const handleRegenerateToken = async () => {
        if (!desktopApi.available) return;
        await desktopApi.mcpRegenerateToken();
        const updated = await desktopApi.mcpGetSettings();
        setSettings(updated);
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
                    />
                    <ActionColumn>
                        <ConfigBox>
                            <ConfigSnippet>
                                {getConfigSnippet(settings.url, settings.token)}
                            </ConfigSnippet>
                            <CopyButtonWrapper>
                                <Button
                                    size="small"
                                    iconLeft="arrowsClockwise"
                                    intent="neutral"
                                    onClick={() => setIsRegenerateModalOpen(true)}
                                >
                                    Regenerate token
                                </Button>
                                <Button
                                    size="small"
                                    iconLeft="copy"
                                    intent="neutral"
                                    onClick={handleCopyConfig}
                                >
                                    Copy
                                </Button>
                            </CopyButtonWrapper>
                        </ConfigBox>
                    </ActionColumn>
                </SectionItem>
            )}
            {isRegenerateModalOpen && (
                <RegenerateTokenModal
                    onCancel={() => setIsRegenerateModalOpen(false)}
                    onSubmit={handleRegenerateToken}
                />
            )}
        </>
    );
};
