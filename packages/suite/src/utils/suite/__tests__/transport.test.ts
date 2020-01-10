import { isWebUSB } from '../transport';

const TRANSPORT = {
    type: 'bridge',
    bridge: {
        version: [1, 0, 0],
        directory: '',
        packages: [{ platform: '', name: '', url: '' }],
        changelog: '',
    },
};

const fixtures = [
    {
        description: `Transport is webusb`,
        transport: {
            ...TRANSPORT,
            type: 'WebUsbPlugin',
        },
        result: true,
    },
    {
        description: `Transport is not webusb (bridge)`,
        transport: TRANSPORT,
        result: false,
    },
    {
        description: `Transport is not webusb (not defined)`,
        transport: undefined,
        result: false,
    },
];

describe('transport', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const instance = isWebUSB(f.transport);
            expect(instance).toEqual(f.result);
        });
    });
});
