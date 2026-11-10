import { parseVerifiedAccountStateRequest } from './request';

const SLOT_0 = `0x${'0'.repeat(64)}`;
const SLOT_1 = `0x${'0'.repeat(63)}1`;

const mockRequest = (overrides: Record<string, unknown> = {}) => ({
    requestId: 'req-1',
    chainId: '1',
    address: '0xB685760EBD368a891F27ae547391F4E2A289895b',
    storageKeys: [SLOT_0],
    ...overrides,
});

describe(parseVerifiedAccountStateRequest.name, () => {
    it('accepts up to four distinct lowercase 32-byte slots', () => {
        const storageKeys = [SLOT_0, SLOT_1, `0x${'0'.repeat(63)}2`, `0x${'f'.repeat(64)}`];

        expect(parseVerifiedAccountStateRequest(mockRequest({ storageKeys }))).toEqual({
            ok: true,
            request: mockRequest({ storageKeys }),
        });
    });

    it('accepts a request without slots (code hash only)', () => {
        expect(parseVerifiedAccountStateRequest(mockRequest({ storageKeys: [] }))).toMatchObject({
            ok: true,
        });
    });

    it.each([
        ['missing slots', mockRequest({ storageKeys: undefined })],
        ['a short slot', mockRequest({ storageKeys: ['0x0'] })],
        ['an uppercase slot', mockRequest({ storageKeys: [`0x${'A'.repeat(64)}`] })],
        ['a duplicate slot', mockRequest({ storageKeys: [SLOT_0, SLOT_0] })],
        [
            'more than four slots',
            mockRequest({
                storageKeys: Array.from({ length: 5 }, (_, index) => `0x${'0'.repeat(63)}${index}`),
            }),
        ],
        ['an invalid address', mockRequest({ address: '0x1234' })],
    ])('refuses %s', (_name, request) => {
        expect(parseVerifiedAccountStateRequest(request)).toEqual({
            ok: false,
            requestId: 'req-1',
            code: 'INVALID_REQUEST',
        });
    });

    it('refuses chains other than mainnet', () => {
        expect(parseVerifiedAccountStateRequest(mockRequest({ chainId: '5' }))).toEqual({
            ok: false,
            requestId: 'req-1',
            code: 'UNSUPPORTED_CHAIN',
        });
    });
});
