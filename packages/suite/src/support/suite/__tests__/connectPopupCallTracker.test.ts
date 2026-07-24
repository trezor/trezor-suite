import { createConnectPopupCallTracker } from '../connectPopupCallTracker';

describe(createConnectPopupCallTracker.name, () => {
    describe('ownsActiveCall', () => {
        it('authorizes the connection that owns the active call', () => {
            const tracker = createConnectPopupCallTracker();
            tracker.setActive('ws-1');

            expect(tracker.ownsActiveCall('ws-1')).toBe(true);
        });

        it('rejects a cancel from a different connection', () => {
            const tracker = createConnectPopupCallTracker();
            tracker.setActive('ws-1');

            expect(tracker.ownsActiveCall('ws-2')).toBe(false);
        });

        it('isolates WS and MCP connections from each other', () => {
            const tracker = createConnectPopupCallTracker();
            tracker.setActive('mcp');

            expect(tracker.ownsActiveCall('ws-1')).toBe(false);
            expect(tracker.ownsActiveCall('mcp')).toBe(true);
        });

        it('cancels unconditionally when the requester has no per-connection transport', () => {
            const tracker = createConnectPopupCallTracker();
            tracker.setActive('ws-1');

            expect(tracker.ownsActiveCall(undefined)).toBe(true);
        });

        it('rejects a scoped cancel when there is no active call', () => {
            const tracker = createConnectPopupCallTracker();

            expect(tracker.ownsActiveCall('ws-1')).toBe(false);
        });
    });

    describe('setActive / clearActive', () => {
        it('clears the active call only when it still belongs to the given connection', () => {
            const tracker = createConnectPopupCallTracker();
            tracker.setActive('ws-1');

            // A later call from another connection took over; ws-1 finishing must not clear it.
            tracker.setActive('ws-2');
            tracker.clearActive('ws-1');
            expect(tracker.ownsActiveCall('ws-2')).toBe(true);

            tracker.clearActive('ws-2');
            expect(tracker.ownsActiveCall('ws-2')).toBe(false);
        });
    });

    describe('cancelQueued', () => {
        it('flags the connection’s queued calls so they can self-reject', () => {
            const tracker = createConnectPopupCallTracker();
            const entry = tracker.register('ws-1');

            tracker.cancelQueued('ws-1');

            expect(entry.canceled).toBe(true);
        });

        it('does not flag calls belonging to other connections', () => {
            const tracker = createConnectPopupCallTracker();
            const own = tracker.register('ws-1');
            const other = tracker.register('ws-2');

            tracker.cancelQueued('ws-1');

            expect(own.canceled).toBe(true);
            expect(other.canceled).toBe(false);
        });

        it('does not affect a future call from the same connection (no lingering tombstone)', () => {
            const tracker = createConnectPopupCallTracker();
            const first = tracker.register('ws-1');

            tracker.cancelQueued('ws-1');
            expect(first.canceled).toBe(true);

            const second = tracker.register('ws-1');
            expect(second.canceled).toBe(false);
        });

        it('is a no-op for a requester without a per-connection transport', () => {
            const tracker = createConnectPopupCallTracker();
            const entry = tracker.register(undefined);

            expect(() => tracker.cancelQueued(undefined)).not.toThrow();
            expect(entry.canceled).toBe(false);
        });
    });

    describe('register / unregister', () => {
        it('registers with an un-canceled entry', () => {
            const tracker = createConnectPopupCallTracker();

            expect(tracker.register('ws-1')).toEqual({ canceled: false });
        });

        it('stops tracking an entry once unregistered', () => {
            const tracker = createConnectPopupCallTracker();
            const entry = tracker.register('ws-1');

            tracker.unregister('ws-1', entry);
            tracker.cancelQueued('ws-1');

            expect(entry.canceled).toBe(false);
        });
    });
});
