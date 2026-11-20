import type { ServerInfoResponse } from 'xrpl';

import { transformRippleServerInfo } from './serverInfo';

type ServerInfo = ServerInfoResponse['result']['info'];

const mockServerInfoResponse = (overrides: Partial<ServerInfo> = {}): ServerInfoResponse => ({
    id: 1,
    type: 'response',
    result: {
        info: {
            build_version: '2.4.0',
            complete_ledgers: '32570-95000000',
            hostid: 'TEST',
            io_latency_ms: 1,
            jq_trans_overflow: '0',
            last_close: { converge_time_s: 2, proposers: 35 },
            peers: 21,
            ports: [],
            pubkey_node: 'n9KUjqxCr5FKThSNXdzb7oqN8rYwScB2dUnNqxQxbEA17JkaWy5x',
            server_state: 'full',
            server_state_duration_us: '1000',
            state_accounting: {
                connected: { duration_us: '0', transitions: '0' },
                disconnected: { duration_us: '0', transitions: '0' },
                full: { duration_us: '0', transitions: '0' },
                syncing: { duration_us: '0', transitions: '0' },
                tracking: { duration_us: '0', transitions: '0' },
            },
            time: '2026-Nov-12 12:00:00.000000 UTC',
            uptime: 1000,
            validated_ledger: {
                age: 1,
                base_fee_xrp: 0.00001,
                hash: '4BC50C9B0D8515D3EAAE1E74B29A95804346C491EE1A95BF25E4AAB854A6A652',
                reserve_base_xrp: 1,
                reserve_inc_xrp: 0.2,
                seq: 95000000,
            },
            validation_quorum: 28,
            ...overrides,
        },
    },
});

describe(transformRippleServerInfo.name, () => {
    it('maps the validated ledger to the server info', () => {
        expect(transformRippleServerInfo(mockServerInfoResponse())).toEqual({
            name: 'Ripple',
            shortcut: 'xrp',
            network: 'xrp',
            testnet: false,
            version: '2.4.0',
            decimals: 6,
            blockHeight: 95000000,
            blockHash: '4BC50C9B0D8515D3EAAE1E74B29A95804346C491EE1A95BF25E4AAB854A6A652',
        });
    });

    it('falls back to an empty block when no ledger is validated yet', () => {
        expect(
            transformRippleServerInfo(mockServerInfoResponse({ validated_ledger: undefined })),
        ).toMatchObject({ blockHeight: 0, blockHash: '' });
    });
});
