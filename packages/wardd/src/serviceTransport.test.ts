import { WebUSB } from 'usb';
import type { UsbDevice } from 'usb/index';

import { ServiceTimeout, openServiceTransport } from './serviceTransport';

// Like node-usb, a native read stays pending until a report arrives or the interface is released.
const mockUsbDevice = () => {
    const calls: unknown[] = [];
    const reads: { resolve: (data: Uint8Array) => void; reject: (error: Error) => void }[] = [];
    const alternate: USBAlternateInterface = {
        alternateSetting: 0,
        interfaceClass: 0xff,
        interfaceSubclass: 0x57,
        interfaceProtocol: 1,
        interfaceName: null,
        endpoints: [
            { endpointNumber: 4, direction: 'in', type: 'interrupt', packetSize: 64 },
            { endpointNumber: 4, direction: 'out', type: 'interrupt', packetSize: 64 },
        ],
    };
    const configuration: USBConfiguration = {
        configurationValue: 1,
        configurationName: null,
        interfaces: [
            {
                interfaceNumber: 0,
                claimed: false,
                alternate: { ...alternate, interfaceSubclass: 0 },
                alternates: [{ ...alternate, interfaceSubclass: 0 }],
            },
            { interfaceNumber: 3, claimed: false, alternate, alternates: [alternate] },
        ],
    };
    const device: Pick<
        UsbDevice,
        | 'vendorId'
        | 'serialNumber'
        | 'configuration'
        | 'configurations'
        | 'open'
        | 'close'
        | 'claimInterface'
        | 'releaseInterface'
        | 'selectConfiguration'
        | 'selectAlternateInterface'
        | 'nativeTransferIn'
        | 'nativeTransferOut'
    > = {
        vendorId: 0x1209,
        serialNumber: 'test-device',
        configuration,
        configurations: [configuration],
        open: () => {
            calls.push('open');

            return Promise.resolve();
        },
        close: () => {
            calls.push('close');

            return Promise.resolve();
        },
        claimInterface: iface => {
            calls.push(['claim', iface]);

            return Promise.resolve();
        },
        releaseInterface: iface => {
            calls.push(['release', iface]);
            reads.splice(0).forEach(read => read.reject(new Error('Cancelled')));

            return Promise.resolve();
        },
        selectConfiguration: value => {
            calls.push(['configuration', value]);

            return Promise.resolve();
        },
        selectAlternateInterface: iface => {
            calls.push(['alternate', iface]);

            return Promise.resolve();
        },
        nativeTransferIn: (endpoint, _timeout, length) => {
            calls.push(['read', endpoint, length]);

            return new Promise((resolve, reject) => reads.push({ resolve, reject }));
        },
        nativeTransferOut: (endpoint, _timeout, report) => {
            calls.push(['write', endpoint, report.length]);

            return Promise.resolve(report.length);
        },
    };
    // The unused identity/control-transfer members are outside this adapter's contract.
    const enumeration = jest
        .spyOn(WebUSB.prototype, 'getDevices')
        .mockResolvedValue([device as UsbDevice]);

    return {
        calls,
        outstandingReads: () => reads.length,
        deliver: (report: Uint8Array) => reads.shift()!.resolve(report),
        restore: () => enumeration.mockRestore(),
    };
};

it('claims only the WARD interface without resetting the active wallet configuration', async () => {
    const usb = mockUsbDevice();
    try {
        const transport = await openServiceTransport('usb:test-device');
        usb.deliver(new Uint8Array(64));
        await transport.read(100);
        await transport.write(Buffer.alloc(64));
        await transport.close();

        expect(usb.calls.filter(call => !Array.isArray(call) || call[0] !== 'read')).toEqual([
            'open',
            ['claim', 3],
            ['write', 4, 64],
            ['release', 3],
            'close',
        ]);
        expect(usb.calls).toContainEqual(['read', 4, 64]);
    } finally {
        usb.restore();
    }
});

it('keeps a report that arrives after a read timed out', async () => {
    const usb = mockUsbDevice();
    try {
        const transport = await openServiceTransport('usb:test-device');
        await expect(transport.read(10)).rejects.toBeInstanceOf(ServiceTimeout);
        await expect(transport.read(10)).rejects.toBeInstanceOf(ServiceTimeout);
        // Timed-out reads must not leave extra native transfers that swallow reports.
        expect(usb.outstandingReads()).toBe(1);

        usb.deliver(new Uint8Array(64).fill(7));
        expect((await transport.read(100))[0]).toBe(7);
        await transport.close();
        await expect(transport.read(100)).rejects.toThrow('WARD service closed');
    } finally {
        usb.restore();
    }
});

it.each(['udp:localhost:65529', 'udp:localhost:0', 'udp:localhost:word', 'wallet:1'])(
    'refuses an invalid service selector %s',
    async selector => {
        await expect(openServiceTransport(selector)).rejects.toThrow('Use ');
    },
);
