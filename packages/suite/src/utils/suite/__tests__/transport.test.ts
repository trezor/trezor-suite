import { isWebUsb } from '../transport';

const fixtures = [
    {
        description: `Transport is webusb`,
        transport: {
            type: 'WebUsbPlugin',
        },
        result: true,
    },
    {
        description: `Transport is not webusb (bridge)`,
        transport: {
            type: 'bridge',
        },
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
            const instance = isWebUsb(f.transport);
            expect(instance).toEqual(f.result);
        });
    });
});
