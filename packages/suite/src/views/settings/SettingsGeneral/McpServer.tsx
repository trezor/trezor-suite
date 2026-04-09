import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Button, Column, Modal, SelectBar } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';
import { GITHUB_MCP_DOCS_URL } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

const ConfigBox = styled.div`
    display: flex;
    flex-direction: column;
    background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation0};
    border-radius: 8px;
    padding: ${spacings.sm}px ${spacings.md}px;
    height: 180px;
`;

const ConfigSnippet = styled.pre`
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    flex: 1;
    overflow-y: auto;
`;

const CopyButtonWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: ${spacings.xs}px;
    margin-top: ${spacings.xs}px;
`;

type McpClient = 'claude-code' | 'claude-desktop' | 'other';

const clientOptions: { label: string; value: McpClient }[] = [
    { label: 'Claude Code', value: 'claude-code' },
    { label: 'Claude Desktop', value: 'claude-desktop' },
    { label: 'Other', value: 'other' },
];

const getAuthUrl = (url: string, token: string | null) => (token ? `${url}?token=${token}` : url);

const getSnippet = (client: McpClient, url: string, token: string | null) => {
    const authUrl = getAuthUrl(url, token);

    if (client === 'claude-code') {
        return `claude mcp add trezor-suite ${authUrl} -t http`;
    }

    if (client === 'claude-desktop') {
        const args = ['mcp-remote', authUrl, '--transport', 'http-only', '--allow-http'];

        return JSON.stringify(
            { mcpServers: { 'trezor-suite': { command: 'npx', args } } },
            null,
            4,
        );
    }

    return JSON.stringify({ mcpServers: { 'trezor-suite': { url: authUrl } } }, null, 4);
};

const RegenerateTokenModal = ({
    onCancel,
    onSubmit,
}: {
    onCancel: () => void;
    onSubmit: () => void;
}) => (
    <Modal
        heading={<Translation id="TR_MCP_REGENERATE_TOKEN_HEADING" />}
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
                    <Translation id="TR_MCP_REGENERATE_TOKEN" />
                </Modal.Button>
                <Modal.Button onClick={onCancel} intent="neutral" priority="secondary">
                    <Translation id="TR_CANCEL" />
                </Modal.Button>
            </>
        }
    >
        <Translation id="TR_MCP_REGENERATE_TOKEN_DESCRIPTION" />
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
    const [selectedClient, setSelectedClient] = useState<McpClient>('claude-code');
    const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

    useEffect(() => {
        if (desktopApi.available) {
            desktopApi.mcpGetSettings().then(setSettings);
        }
    }, []);

    const handleCopy = () => {
        if (!settings?.url) return;
        copyToClipboard(getSnippet(selectedClient, settings.url, settings.token));
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
                    title={<Translation id="TR_MCP_CLIENT_CONFIGURATION" />}
                    description={
                        <Translation
                            id={
                                selectedClient === 'claude-code'
                                    ? 'TR_MCP_PASTE_COMMAND'
                                    : 'TR_MCP_ADD_JSON_CONFIG'
                            }
                        />
                    }
                    bottomContent={<LearnMoreButton url={GITHUB_MCP_DOCS_URL} />}
                />
                <ActionColumn>
                    <Column gap={spacings.sm}>
                        <SelectBar
                            selectedOption={selectedClient}
                            options={clientOptions}
                            onChange={setSelectedClient}
                            size="small"
                        />
                        <ConfigBox>
                            <ConfigSnippet>
                                {getSnippet(selectedClient, settings.url, settings.token)}
                            </ConfigSnippet>
                            <CopyButtonWrapper>
                                <Button
                                    size="small"
                                    iconLeft="arrowsClockwise"
                                    intent="neutral"
                                    onClick={() => setIsRegenerateModalOpen(true)}
                                >
                                    <Translation id="TR_MCP_REGENERATE_TOKEN" />
                                </Button>
                                <Button
                                    size="small"
                                    iconLeft="copy"
                                    intent="neutral"
                                    onClick={handleCopy}
                                >
                                    <Translation id="TR_COPY_TO_CLIPBOARD" />
                                </Button>
                            </CopyButtonWrapper>
                        </ConfigBox>
                    </Column>
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
