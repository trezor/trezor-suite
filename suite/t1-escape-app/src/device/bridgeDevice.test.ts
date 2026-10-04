import { type Descriptor, PathPublic, Session, TRANSPORT } from '@trezor/transport-common';

import { getDeviceLostReason, isBridgeVersionSupported, selectDevice } from './bridgeDevice';
import { createDeviceSession } from './deviceSession';
import { lockDevice } from './lockDevice';
import { mockDevice } from '../../mocks/mockDevice';
import { mockWallet } from '../../mocks/mockWallet';

const descriptor = (overrides: Partial<Descriptor> = {}): Descriptor => ({
    path: PathPublic('1'),
    session: null,
    type: 0,
    apiType: 'usb',
    ...overrides,
});

describe('isBridgeVersionSupported', () => {
    it.each([
        ['3.3.0', true],
        ['3.3.1', true],
        ['3.10.0', true],
        ['4.0.0', true],
        ['3.2.1', false],
        ['2.0.33', false],
        ['', false],
        ['not a version', false],
    ])('bridge %s is supported: %s', (version, isSupported) => {
        expect(isBridgeVersionSupported(version)).toBe(isSupported);
    });
});

describe('selectDevice', () => {
    it('finds nothing when no Trezor is connected', () => {
        expect(selectDevice([])).toEqual({ type: 'none' });
    });

    it('picks the HID Trezor One, which the bridge reports as type 0', () => {
        const legacy = descriptor({ path: PathPublic('2'), type: 0 });

        expect(selectDevice([descriptor({ type: 3 }), legacy])).toEqual({
            type: 'legacy-trezor-one',
            descriptor: legacy,
        });
    });

    it.each([1, 2, 3, 4, 5, 6])('leaves a device of type %i to Trezor Suite', type => {
        expect(selectDevice([descriptor({ type })])).toEqual({ type: 'other-trezor' });
    });

    it('does not guess between two old Trezors', () => {
        expect(
            selectDevice([
                descriptor({ path: PathPublic('1') }),
                descriptor({ path: PathPublic('2') }),
            ]),
        ).toEqual({ type: 'several-legacy-trezors' });
    });
});

describe('getDeviceLostReason', () => {
    const session = Session('5');

    it('reports a disconnect', () => {
        expect(getDeviceLostReason({ type: TRANSPORT.DEVICE_DISCONNECTED }, session)).toBe(
            'disconnected',
        );
    });

    it('ignores the session change caused by our own acquire', () => {
        expect(
            getDeviceLostReason(
                { type: TRANSPORT.DEVICE_SESSION_CHANGED, descriptor: descriptor({ session }) },
                session,
            ),
        ).toBeUndefined();
    });

    it.each([Session('6'), null])('reports the session changing to %s as taken', other => {
        expect(
            getDeviceLostReason(
                {
                    type: TRANSPORT.DEVICE_SESSION_CHANGED,
                    descriptor: descriptor({ session: other }),
                },
                session,
            ),
        ).toBe('session-taken');
    });
});

describe('lockDevice', () => {
    it('sends Initialize and then LockDevice', async () => {
        const device = mockDevice({ wallets: { '': mockWallet() } });
        const session = createDeviceSession({
            transportCall: device.transportCall,
            getDeviceLostReason: () => undefined,
            requestPin: () => Promise.resolve(undefined),
            requestPassphrase: () => Promise.resolve(undefined),
            onButtonRequest: () => undefined,
        });

        expect((await lockDevice(session.call)).success).toBe(true);
        expect(device.calls).toEqual([
            { name: 'Initialize', data: {} },
            { name: 'LockDevice', data: {} },
        ]);
    });
});
