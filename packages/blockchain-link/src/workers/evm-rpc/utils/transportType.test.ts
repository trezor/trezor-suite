import { orderEndpointsForRequests } from './transportType';

describe(orderEndpointsForRequests.name, () => {
    it('tries every HTTP endpoint before a WebSocket one', () => {
        const ordered = orderEndpointsForRequests([
            'wss://a.example',
            'https://b.example',
            'ws://c.example',
            'http://d.example',
        ]);

        expect(ordered.slice(0, 2).sort()).toEqual(['http://d.example', 'https://b.example']);
        expect(ordered.slice(2).sort()).toEqual(['ws://c.example', 'wss://a.example']);
    });

    it('still connects when only WebSocket endpoints are configured', () => {
        expect(orderEndpointsForRequests(['wss://a.example'])).toEqual(['wss://a.example']);
    });
});
