import type { ThpChannelState, TransportProtocol } from '@trezor/protocol';

export type BridgeProtocolMessage = {
    data: string;
    protocol: TransportProtocol['name'];
    thpState?: ThpChannelState;
};

// validate expected body:
// - json string (protocol message)
// - parsed json string (parsed protocol message)
export function validateProtocolMessage(body: unknown, withData = true): BridgeProtocolMessage {
    const isHex = (s: string) => /^[0-9A-Fa-f]+$/g.test(s); // TODO: trezor/utils accepts 0x prefix (eth)
    const isValidProtocol = (s: any): s is BridgeProtocolMessage['protocol'] =>
        s === 'v1' || s === 'v2' || s === 'bridge';

    let json: Record<string, any> | undefined | null;
    if (typeof body === 'object') {
        json = body;
    } else {
        try {
            json = JSON.parse(body as any);
        } catch {
            // silent, resolved below
        }
    }

    if (!json) {
        throw new Error('Invalid BridgeProtocolMessage body');
    }

    // validate BridgeProtocolMessage['protocol']
    if (typeof json.protocol !== 'string' || !isValidProtocol(json.protocol)) {
        throw new Error('Invalid BridgeProtocolMessage protocol');
    }
    // optionally validate BridgeProtocolMessage['data]
    if (withData && (typeof json.data !== 'string' || !isHex(json.data))) {
        throw new Error('Invalid BridgeProtocolMessage data');
    }

    return {
        protocol: json.protocol,
        data: json.data,
        thpState: json.thpState,
    };
}

export function createProtocolMessage(
    body: unknown,
    protocol: TransportProtocol | TransportProtocol['name'],
    thpState?: ThpChannelState,
) {
    let data;
    if (Buffer.isBuffer(body)) {
        data = body.toString('hex');
    }
    if (typeof body === 'string') {
        data = body;
    }
    if (typeof data !== 'string') {
        data = '';
    }

    return JSON.stringify({
        protocol: typeof protocol === 'string' ? protocol : protocol.name,
        data,
        thpState,
    });
}
