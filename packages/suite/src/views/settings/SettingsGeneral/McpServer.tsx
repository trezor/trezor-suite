import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Button, Modal } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';
import { GITHUB_MCP_DOCS_URL } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

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

const getAuthUrl = (url: string, token: string | null) => (token ? `${url}?token=${token}` : url);

const getCliCommand = (url: string, token: string | null) =>
    `claude mcp add trezor-suite ${getAuthUrl(url, token)} -t http`;

const getDesktopConfig = (url: string, token: string | null) => {
    const authUrl = getAuthUrl(url, token);
    const args = ['mcp-remote', authUrl, '--transport', 'http-only', '--allow-http'];

    return JSON.stringify({ mcpServers: { 'trezor-suite': { command: 'npx', args } } }, null, 4);
};

const getJsonConfig = (url: string, token: string | null) =>
    JSON.stringify({ mcpServers: { 'trezor-suite': { url: getAuthUrl(url, token) } } }, null, 4);

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

    const handleCopyCliCommand = () => {
        if (!settings?.url) return;
        copyToClipboard(getCliCommand(settings.url, settings.token));
    };

    const handleCopyDesktopConfig = () => {
        if (!settings?.url) return;
        copyToClipboard(getDesktopConfig(settings.url, settings.token));
    };

    const handleCopyJsonConfig = () => {
        if (!settings?.url) return;
        copyToClipboard(getJsonConfig(settings.url, settings.token));
    };

    const handleRegenerateToken = async () => {
        if (!desktopApi.available) return;
        await desktopApi.mcpRegenerateToken();
        const updated = await desktopApi.mcpGetSettings();
        setSettings(updated);
    };

    if (!settings?.url) return null;

    return (
        <>
            <SectionItem>
                <TextColumn
                    title="Claude Code"
                    description="Run this command in your terminal to add the Trezor MCP server."
                    bottomContent={<LearnMoreButton url={GITHUB_MCP_DOCS_URL} />}
                />
                <ActionColumn>
                    <ConfigBox>
                        <ConfigSnippet>{getCliCommand(settings.url, settings.token)}</ConfigSnippet>
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
                                onClick={handleCopyCliCommand}
                            >
                                Copy
                            </Button>
                        </CopyButtonWrapper>
                    </ConfigBox>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Claude Desktop"
                    description="Add this to your claude_desktop_config.json. Requires npx (Node.js)."
                />
                <ActionColumn>
                    <ConfigBox>
                        <ConfigSnippet>
                            {getDesktopConfig(settings.url, settings.token)}
                        </ConfigSnippet>
                        <CopyButtonWrapper>
                            <Button
                                size="small"
                                iconLeft="copy"
                                intent="neutral"
                                onClick={handleCopyDesktopConfig}
                            >
                                Copy
                            </Button>
                        </CopyButtonWrapper>
                    </ConfigBox>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Other MCP Clients"
                    description="Add this JSON to your MCP client config (Cursor, VS Code, etc.)."
                />
                <ActionColumn>
                    <ConfigBox>
                        <ConfigSnippet>{getJsonConfig(settings.url, settings.token)}</ConfigSnippet>
                        <CopyButtonWrapper>
                            <Button
                                size="small"
                                iconLeft="copy"
                                intent="neutral"
                                onClick={handleCopyJsonConfig}
                            >
                                Copy
                            </Button>
                        </CopyButtonWrapper>
                    </ConfigBox>
                </ActionColumn>
            </SectionItem>
            {isRegenerateModalOpen && (
                <RegenerateTokenModal
                    onCancel={() => setIsRegenerateModalOpen(false)}
                    onSubmit={handleRegenerateToken}
                />
            )}
        </>
    );
};
