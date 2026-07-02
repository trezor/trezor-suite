import { useEffect, useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { Column, ProgressBar, Row, Switch, Text } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import {
    type MonerodDownloadEvent,
    type MonerodStatus,
    type MonerodStatusEvent,
    type MonerodSyncEvent,
    desktopApi,
} from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

const toPercent = (current: number, total: number) =>
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

// Status label shown while the node is in a non-terminal, non-error phase.
const STATUS_LABEL: Record<Exclude<MonerodStatus, 'Disabled' | 'Error'>, TranslationKey> = {
    Downloading: 'TR_MONEROD_DOWNLOADING',
    Starting: 'TR_MONEROD_STARTING',
    Syncing: 'TR_MONEROD_SYNCING',
    Enabled: 'TR_MONEROD_RUNNING',
};

export const Monerod = () => {
    const [status, setStatus] = useState<MonerodStatus>('Disabled');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [syncProgress, setSyncProgress] = useState<number | null>(null);
    // Raw block height/target — the percentage is too coarse for Monero's multi-hour sync
    // (1% ≈ tens of thousands of blocks), so we also surface the live block count, which visibly
    // ticks up every few seconds and makes it obvious the node is making progress.
    const [syncBlocks, setSyncBlocks] = useState<{ height: number; target: number } | null>(null);

    useEffect(() => {
        desktopApi.on('monerod/status', (event: MonerodStatusEvent) => {
            setStatus(event.type);
            setStatusMessage(event.message ?? null);
            if (event.type === 'Disabled') {
                setDownloadProgress(null);
                setSyncProgress(null);
                setSyncBlocks(null);
            }
        });
        desktopApi.on('monerod/download-progress', (event: MonerodDownloadEvent) => {
            setDownloadProgress(toPercent(event.progress.current, event.progress.total));
        });
        desktopApi.on('monerod/sync-progress', (event: MonerodSyncEvent) => {
            setSyncProgress(toPercent(event.progress.current, event.progress.total));
            setSyncBlocks({ height: event.height, target: event.targetHeight });
        });

        desktopApi.getMonerodStatus();

        return () => {
            desktopApi.removeAllListeners('monerod/status');
            desktopApi.removeAllListeners('monerod/download-progress');
            desktopApi.removeAllListeners('monerod/sync-progress');
        };
    }, []);

    const isEnabled = status !== 'Disabled';

    const handleSwitch = () => {
        desktopApi.toggleMonerod(!isEnabled);
    };

    // Sync progress takes precedence once the daemon is running; download comes first.
    const isSyncing = syncProgress !== null && status === 'Syncing';
    const progress = isSyncing ? syncProgress : downloadProgress;

    const renderStatus = () => {
        if (status === 'Disabled') {
            return undefined;
        }

        if (status === 'Error') {
            return (
                <Text
                    typographyStyle="body-sm"
                    intent="critical"
                    data-testid="@settings/monerod/error"
                >
                    <Translation id="TR_MONEROD_ERROR" values={{ error: statusMessage ?? '' }} />
                </Text>
            );
        }

        return (
            <Column gap={spacings.xs} alignItems="stretch" data-testid="@settings/monerod/progress">
                <Row gap={spacings.sm} alignItems="center">
                    <Text typographyStyle="body-sm">
                        <Translation id={STATUS_LABEL[status]} />
                    </Text>
                    {progress !== null && <ProgressBar value={progress} />}
                    {progress !== null && (
                        <Text typographyStyle="body-sm" data-testid="@settings/monerod/percentage">
                            {progress} %
                        </Text>
                    )}
                </Row>
                {status === 'Syncing' && syncBlocks !== null && (
                    // Own line so the long "x / y blocks" count doesn't get squeezed and wrap.
                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        data-testid="@settings/monerod/blocks"
                    >
                        <Translation
                            id="TR_MONEROD_SYNC_BLOCKS"
                            values={{
                                current: syncBlocks.height.toLocaleString(),
                                total: syncBlocks.target.toLocaleString(),
                            }}
                        />
                    </Text>
                )}
            </Column>
        );
    };

    return (
        <SectionItem data-testid="@settings/monerod/section">
            <TextColumn
                title={<Translation id="TR_MONEROD_TITLE" />}
                description={<Translation id="TR_MONEROD_DESCRIPTION" />}
                bottomContent={renderStatus()}
            />
            <ActionColumn>
                <Switch
                    data-testid="@settings/monerod/toggle"
                    isChecked={isEnabled}
                    onChange={handleSwitch}
                />
            </ActionColumn>
        </SectionItem>
    );
};
