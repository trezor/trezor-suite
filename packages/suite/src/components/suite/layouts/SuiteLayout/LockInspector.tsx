import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { selectIsDebugModeActive } from '@suite/debug';
import { LOCK_TYPE, type TrackedLock, selectActiveLocks } from '@suite/locks';
import { Badge, Card, Column, Row, Text } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

const TICK_MS = 500;
const VISIBLE_ROWS = 10;
const ROW_HEIGHT_PX = 20;
const WIDTH_PX = 840;

// A reserved list height keeps the overlay the same size as locks come and go.
const LIST_HEIGHT_PX = VISIBLE_ROWS * ROW_HEIGHT_PX;

// Floats over the whole app rather than sitting in the sidebar, so long method names stay
// readable. Below `modal` so dialogs are still usable while it is open.
const Overlay = styled.div`
    position: fixed;
    bottom: 16px;
    left: 16px;
    width: ${WIDTH_PX}px;
    max-width: calc(100vw - 32px);
    z-index: ${zIndices.popover};
`;

const Elapsed = styled.div`
    min-width: 64px;
    text-align: right;
`;

const Ordinal = styled.div`
    min-width: 32px;
`;

const formatDuration = (ms: number) => {
    const seconds = Math.max(ms, 0) / 1000;

    return seconds < 60
        ? `${seconds.toFixed(1)}s`
        : `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
};

const useNow = (isTicking: boolean) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isTicking) return;

        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), TICK_MS);

        return () => clearInterval(interval);
    }, [isTicking]);

    return now;
};

type LockRowProps = {
    lock: TrackedLock;
    position: number;
    isRunning: boolean;
    now: number;
};

const LockRow = ({ lock, position, isRunning, now }: LockRowProps) => (
    <Row gap={8} justifyContent="space-between" height={ROW_HEIGHT_PX}>
        <Ordinal>
            <Text typographyStyle="body-xs" priority="secondary">
                {position}
            </Text>
        </Ordinal>
        <Text typographyStyle="body-xs" ellipsisLineCount={1} flex="1" minWidth={0}>
            {lock.origin}
        </Text>
        <Badge size="small" intent={isRunning ? 'critical' : 'warning'}>
            {isRunning ? 'running' : 'queued'}
        </Badge>
        <Elapsed>
            <Text typographyStyle="body-xs" priority="secondary">
                {formatDuration(now - lock.acquiredAt)}
            </Text>
        </Elapsed>
    </Row>
);

/**
 * Debug-only view of the locks that currently block device-dependent controls, so a disabled
 * button can be traced to the call holding it. See `lockTrackerSlice`.
 */
export const LockInspector = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const activeLocks = useSelector(selectActiveLocks);

    // Router locks restrict navigation only; `useDevice().isLocked` gates controls on the
    // device and UI counters, so those are the holds worth showing here.
    const blockingLocks = activeLocks.filter(
        lock => lock.type === LOCK_TYPE.DEVICE || lock.type === LOCK_TYPE.UI,
    );

    const now = useNow(isDebugModeActive && blockingLocks.length > 0);

    if (!isDebugModeActive) return null;

    // Device calls are serialized by a FIFO mutex taken *after* the lock, so only the oldest
    // device hold is really talking to the device; the rest are queued behind it.
    const runningDeviceLockId = blockingLocks.find(lock => lock.type === LOCK_TYPE.DEVICE)?.id;

    return (
        <Overlay data-testid="@debug/lock-inspector">
            <Card paddingType="small">
                <Column gap={4} alignItems="stretch">
                    <Row gap={8} justifyContent="space-between" height={ROW_HEIGHT_PX}>
                        <Text typographyStyle="body-sm-strong">Device locks</Text>
                        <Text typographyStyle="body-xs" priority="secondary">
                            {blockingLocks.length}
                        </Text>
                    </Row>

                    <Column gap={0} alignItems="stretch" height={LIST_HEIGHT_PX} overflow="auto">
                        {blockingLocks.length === 0 ? (
                            <Text typographyStyle="body-xs" priority="secondary">
                                Nothing is blocked.
                            </Text>
                        ) : (
                            blockingLocks.map((lock, index) => (
                                <LockRow
                                    key={lock.id}
                                    lock={lock}
                                    position={index + 1}
                                    isRunning={
                                        lock.type !== LOCK_TYPE.DEVICE ||
                                        lock.id === runningDeviceLockId
                                    }
                                    now={now}
                                />
                            ))
                        )}
                    </Column>
                </Column>
            </Card>
        </Overlay>
    );
};
