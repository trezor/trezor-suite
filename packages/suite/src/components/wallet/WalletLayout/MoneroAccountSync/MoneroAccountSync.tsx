import { type ReactNode, useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectActiveBackendType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    Banner,
    Button,
    Card,
    Column,
    InfoItem,
    ProgressBar,
    Range,
    Row,
    Spinner,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useEta } from 'src/hooks/suite/useEta';
import { type MoneroBirthday, useMoneroScanProgress } from 'src/hooks/suite/useMoneroScanProgress';
import { MONERO_REQUIRED_BYTES, useMonerodSync } from 'src/hooks/suite/useMonerodSync';

const formatGb = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(1)} GB`;

// Node sync phases (the local monerod catching up to the network).
const NODE_LABEL = {
    Downloading: 'TR_MONEROD_DOWNLOADING',
    Starting: 'TR_MONEROD_STARTING',
    Syncing: 'TR_MONEROD_SYNCING',
} as const;

// Monero's first block (April 2014); the birthday slider spans from here to the current month.
const GENESIS_YEAR = 2014;
const GENESIS_MONTH = 4;

const monthsSinceGenesis = () => {
    const now = new Date();

    return (now.getFullYear() - GENESIS_YEAR) * 12 + (now.getMonth() + 1 - GENESIS_MONTH);
};

const indexToBirthday = (index: number): MoneroBirthday => {
    const absolute = GENESIS_YEAR * 12 + (GENESIS_MONTH - 1) + index;

    return { year: Math.floor(absolute / 12), month: (absolute % 12) + 1 };
};

const formatBirthday = ({ year, month }: MoneroBirthday) =>
    new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

// The scan's start block timestamp (unix seconds) → a "Month Year" label, or null if unknown.
const formatBirthdayTimestamp = (seconds: number) =>
    seconds > 0
        ? new Date(seconds * 1000).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
          })
        : null;

const toPercent = (current: number, total: number) =>
    total > 0 ? Math.min(99, Math.round((current / total) * 100)) : 0;

// Estimated milliseconds remaining → a short "5 min" / "1 h 20 min" label.
const formatEta = (ms: number) => {
    const totalMinutes = Math.max(1, Math.round(ms / 60_000));
    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
};

const ProgressCard = ({
    label,
    percent,
    blocks,
    etaMs,
}: {
    label: TranslationKey;
    percent: number | null;
    blocks: { height: number; target: number } | null;
    etaMs?: number | null;
}) => (
    <Card>
        <Column gap={spacings.md} alignItems="center">
            <Text typographyStyle="body-md">
                <Translation id={label} />
            </Text>
            {percent !== null && (
                <>
                    <ProgressBar value={percent} />
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {percent} %
                    </Text>
                </>
            )}
            {blocks !== null && (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation
                        id="TR_MONEROD_SYNC_BLOCKS"
                        values={{
                            current: blocks.height.toLocaleString(),
                            total: blocks.target.toLocaleString(),
                        }}
                    />
                </Text>
            )}
            {etaMs != null && (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_MONERO_ETA" values={{ eta: formatEta(etaMs) }} />
                </Text>
            )}
        </Column>
    </Card>
);

// Picked slider index per account descriptor, kept across remounts so switching tabs mid-pick
// doesn't reset a chosen date back to genesis.
const birthdayIndexCache = new Map<string, number>();

const BirthdayCard = ({
    onStart,
    onCancel,
    cacheKey,
}: {
    onStart: (birthday: MoneroBirthday) => void | Promise<void>;
    onCancel?: () => void;
    cacheKey?: string;
}) => {
    const total = monthsSinceGenesis();
    // Default to the genesis block (full scan) — always safe; the user moves the slider forward to
    // their wallet's birthday to skip the empty history and scan much faster.
    const [index, setIndexState] = useState(() =>
        cacheKey ? (birthdayIndexCache.get(cacheKey) ?? 0) : 0,
    );
    const setIndex = (value: number) => {
        setIndexState(value);
        if (cacheKey) birthdayIndexCache.set(cacheKey, value);
    };
    // Arming exports the view key (a device confirmation) — keep the button busy so the click reads
    // as "working / confirm on device" instead of looking unresponsive.
    const [starting, setStarting] = useState(false);
    const birthday = indexToBirthday(index);

    return (
        <Card>
            <Column gap={spacings.lg} alignItems="stretch">
                <Column gap={spacings.xs} alignItems="flex-start">
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_MONERO_BIRTHDAY_TITLE" />
                    </Text>
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id="TR_MONERO_BIRTHDAY_DESC" />
                    </Text>
                </Column>

                <Column gap={spacings.xs} alignItems="stretch">
                    <Range
                        min={0}
                        max={total}
                        step="1"
                        value={index}
                        onChange={event => setIndex(Number(event.target.value))}
                        data-testid="@account/monero/birthday-slider"
                    />
                    <Text typographyStyle="body-md-strong">{formatBirthday(birthday)}</Text>
                </Column>

                <Row gap={spacings.sm}>
                    {onCancel && (
                        <Button priority="secondary" onClick={onCancel} isDisabled={starting}>
                            <Translation id="TR_CANCEL" />
                        </Button>
                    )}
                    <Button
                        onClick={async () => {
                            setStarting(true);
                            try {
                                await onStart(birthday);
                            } finally {
                                setStarting(false);
                            }
                        }}
                        isLoading={starting}
                        isDisabled={starting}
                        data-testid="@account/monero/start-sync"
                    >
                        <Translation id="TR_MONERO_ACCOUNT_START_SYNC" />
                    </Button>
                </Row>
            </Column>
        </Card>
    );
};

interface MoneroAccountSyncProps {
    account?: Account;
    children?: ReactNode;
}

/**
 * Pre-flight + sync view shown for a Monero account until it is ready to use. It progresses through:
 * disk-space requirements + "Start synchronization" (node off) → node download/sync progress → wallet
 * birthday picker + start button (node synced, scan not started) → client-side view-key wallet-scan
 * progress → the real account body (`children`) once the wallet has scanned to the chain tip.
 */
export const MoneroAccountSync = ({ account, children }: MoneroAccountSyncProps) => {
    const { status, statusKnown, statusMessage, percent, blocks, diskSpace, start } =
        useMonerodSync();
    // A custom (remote) backend — e.g. a Totem node reached over Tor — means the wallet scans
    // against that node, so the local-node download/sync gate below is skipped entirely and we go
    // straight to the wallet scan.
    const hasRemoteBackend = useSelector(state =>
        account ? !!selectActiveBackendType(state, account.symbol) : false,
    );
    // The wallet scan runs against a synced local node or any configured remote backend.
    const { scan, needsArm, unreachable, startScan } = useMoneroScanProgress(
        account,
        status === 'Enabled' || hasRemoteBackend,
    );
    // The user is mid-scan but wants to pick a different birthday (the picker is shown again).
    const [changingBirthday, setChangingBirthday] = useState(false);
    // Keep the "Start" button busy from the click until the node reports its first status, so
    // launching monerod doesn't look unresponsive.
    const [startingNode, setStartingNode] = useState(false);

    // Time-left estimates from the recent rate of progress (node block sync + wallet block scan).
    const nodeEtaMs = useEta(blocks?.height ?? 0, blocks?.target ?? 0);
    const scanEtaMs = useEta(scan?.scannedHeight ?? 0, scan?.chainHeight ?? 0);

    // Until the first status arrives, we don't yet know if the node is off, starting or already
    // synced — show an indeterminate loader instead of prematurely flashing the disk-space /
    // start-sync screen (the daemon can take a while to open a large existing database).
    if (!hasRemoteBackend && !statusKnown) {
        return (
            <Card>
                <Column gap={spacings.md} alignItems="center">
                    <Spinner size={24} />
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id="TR_MONERO_ACCOUNT_CHECKING" />
                    </Text>
                </Column>
            </Card>
        );
    }

    if (!hasRemoteBackend && status === 'Error') {
        return (
            <Card>
                <Text typographyStyle="body-md" intent="critical">
                    <Translation id="TR_MONEROD_ERROR" values={{ error: statusMessage ?? '' }} />
                </Text>
            </Card>
        );
    }

    if (!hasRemoteBackend && status === 'Disabled') {
        const free = diskSpace?.free ?? null;
        const enoughSpace = free === null || free >= MONERO_REQUIRED_BYTES;

        return (
            <Card>
                <Column gap={spacings.lg} alignItems="stretch">
                    <Column gap={spacings.xs} alignItems="flex-start">
                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_MONERO_ACCOUNT_REQUIREMENTS_TITLE" />
                        </Text>
                        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                            <Translation id="TR_MONERO_ACCOUNT_REQUIREMENTS_DESC" />
                        </Text>
                    </Column>

                    <Row gap={spacings.xxl} flexWrap="wrap">
                        <InfoItem label={<Translation id="TR_MONERO_REQUIRED_SPACE" />}>
                            {formatGb(MONERO_REQUIRED_BYTES)}
                        </InfoItem>
                        <InfoItem label={<Translation id="TR_MONERO_AVAILABLE_SPACE" />}>
                            <Text intent={enoughSpace ? 'neutral' : 'warning'}>
                                {free !== null ? formatGb(free) : '…'}
                            </Text>
                        </InfoItem>
                    </Row>

                    {!enoughSpace && (
                        <Text typographyStyle="body-sm" intent="warning">
                            <Translation id="TR_MONERO_NOT_ENOUGH_SPACE" />
                        </Text>
                    )}

                    <Button
                        onClick={() => {
                            setStartingNode(true);
                            start();
                        }}
                        isDisabled={!enoughSpace || startingNode}
                        isLoading={startingNode}
                        data-testid="@account/monero/start-node"
                    >
                        <Translation id="TR_MONERO_ACCOUNT_START_SYNC" />
                    </Button>
                </Column>
            </Card>
        );
    }

    // Node is still downloading / starting / syncing (local node only).
    if (
        !hasRemoteBackend &&
        (status === 'Downloading' || status === 'Starting' || status === 'Syncing')
    ) {
        return (
            <ProgressCard
                label={NODE_LABEL[status]}
                percent={percent}
                blocks={status === 'Syncing' ? blocks : null}
                etaMs={status === 'Syncing' ? nodeEtaMs : null}
            />
        );
    }

    // Node is synced — drive the client-side view-key scan.

    // The user opened the picker to choose a different birthday (mid-scan or after it finished);
    // restarting discards the current wallet and rebuilds from the new date.
    if (changingBirthday) {
        return (
            <BirthdayCard
                onStart={async birthday => {
                    await startScan(birthday, { reset: true });
                    setChangingBirthday(false);
                }}
                onCancel={() => setChangingBirthday(false)}
                cacheKey={account?.descriptor}
            />
        );
    }

    // Scan finished — the account is usable. If it started above genesis, some older history may have
    // been skipped, so offer to rescan from an earlier date.
    if (scan?.isSynced) {
        return (
            <Column gap={spacings.sm} alignItems="stretch">
                {scan.startHeight > 0 && (
                    <Banner
                        icon
                        intent="info"
                        description={<Translation id="TR_MONERO_MISSING_OLDER_TXS" />}
                        rightContent={
                            <Banner.Button onClick={() => setChangingBirthday(true)}>
                                <Translation id="TR_MONERO_RESCAN_EARLIER" />
                            </Banner.Button>
                        }
                    />
                )}
                {children}
            </Column>
        );
    }

    // Scan in progress (resuming a persisted wallet or catching up). The scan can be re-pointed at a
    // different birthday if the user picked the wrong one.
    if (scan) {
        const birthday = formatBirthdayTimestamp(scan.startTimestamp);

        return (
            <Column gap={spacings.sm} alignItems="stretch">
                <ProgressCard
                    label="TR_MONERO_ACCOUNT_SCANNING"
                    percent={toPercent(scan.scannedHeight, scan.chainHeight)}
                    blocks={{ height: scan.scannedHeight, target: scan.chainHeight }}
                    etaMs={scanEtaMs}
                />
                {birthday && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_MONERO_SCANNING_FROM" values={{ birthday }} />
                    </Text>
                )}
                <Button
                    priority="secondary"
                    onClick={() => setChangingBirthday(true)}
                    data-testid="@account/monero/change-birthday"
                >
                    <Translation id="TR_MONERO_CHANGE_BIRTHDAY" />
                </Button>
            </Column>
        );
    }

    // First run — nothing persisted yet; let the user pick a birthday and arm the scan.
    if (needsArm) {
        return <BirthdayCard onStart={startScan} cacheKey={account?.descriptor} />;
    }

    // Remote (Totem) node unreachable for several polls and nothing has scanned yet — surface it
    // instead of an endless "connecting" spinner. The poll loop keeps retrying underneath, so this
    // recovers on its own once the node answers again (an offline totem often just needs to come
    // back / finish publishing over Tor).
    if (hasRemoteBackend && unreachable) {
        return (
            <Card>
                <Column gap={spacings.md} alignItems="center">
                    <Spinner size={24} />
                    <Text typographyStyle="body-md" intent="warning">
                        <Translation id="TR_MONERO_ACCOUNT_REMOTE_UNREACHABLE" />
                    </Text>
                </Column>
            </Card>
        );
    }

    // The wallet is being opened/built (no scan event yet) — show an indeterminate loader. Over a
    // remote (Totem) node the first block-fetch travels over Tor, so this "building" phase can take a
    // while; a remote-aware label keeps it from looking stuck.
    return (
        <ProgressCard
            label={
                hasRemoteBackend
                    ? 'TR_MONERO_ACCOUNT_CONNECTING_REMOTE'
                    : 'TR_MONERO_ACCOUNT_SCANNING'
            }
            percent={null}
            blocks={null}
        />
    );
};
