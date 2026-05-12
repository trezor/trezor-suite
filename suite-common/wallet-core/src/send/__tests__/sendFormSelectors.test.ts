import {
    selectSendFormButtonRequestCodes,
    selectSendFormReviewButtonRequestsCount,
    selectSendFormReviewLastButtonCode,
} from '../sendFormSelectors';

type AnyState = Parameters<typeof selectSendFormButtonRequestCodes>[0];

const createDeviceState = (codes: string[]): AnyState =>
    ({
        device: {
            selectedDevice: {
                buttonRequests: codes.map(code => ({ code })),
            },
        },
    }) as unknown as AnyState;

describe('selectSendFormButtonRequestCodes', () => {
    it('returns the same array reference across calls when underlying state is unchanged', () => {
        const state = createDeviceState(['ButtonRequest_ConfirmOutput', 'ButtonRequest_SignTx']);

        const first = selectSendFormButtonRequestCodes(state, 'btc' as any);
        const second = selectSendFormButtonRequestCodes(state, 'btc' as any);

        expect(second).toBe(first);
    });

    it('returns a new array reference when buttonRequests change', () => {
        const stateA = createDeviceState(['ButtonRequest_ConfirmOutput']);
        const stateB = createDeviceState(['ButtonRequest_ConfirmOutput', 'ButtonRequest_SignTx']);

        const first = selectSendFormButtonRequestCodes(stateA, 'btc' as any);
        const second = selectSendFormButtonRequestCodes(stateB, 'btc' as any);

        expect(second).not.toBe(first);
        expect(second).toEqual(['ButtonRequest_ConfirmOutput', 'ButtonRequest_SignTx']);
    });

    it('does not mutate the cached array when selectSendFormReviewButtonRequestsCount is called with decreaseOutputId', () => {
        const state = createDeviceState([
            'ButtonRequest_ConfirmOutput',
            'ButtonRequest_ConfirmOutput',
            'ButtonRequest_SignTx',
        ]);

        const before = selectSendFormButtonRequestCodes(state, 'btc' as any);
        const lengthBefore = before.length;

        // Trigger the RBF decrease-output path which historically called .splice(-1, 1).
        selectSendFormReviewButtonRequestsCount(state, 'btc' as any, 0);

        const after = selectSendFormButtonRequestCodes(state, 'btc' as any);
        expect(after).toBe(before);
        expect(after.length).toBe(lengthBefore);
    });
});

describe('selectSendFormReviewButtonRequestsCount', () => {
    it('returns 0 when symbol is undefined', () => {
        const state = createDeviceState(['ButtonRequest_ConfirmOutput']);

        expect(selectSendFormReviewButtonRequestsCount(state, undefined)).toBe(0);
    });

    it('returns the filtered request count for a bitcoin symbol', () => {
        const state = createDeviceState(['ButtonRequest_ConfirmOutput', 'ButtonRequest_SignTx']);

        expect(selectSendFormReviewButtonRequestsCount(state, 'btc' as any)).toBe(2);
    });

    it('drops one ConfirmOutput when decreaseOutputId is provided and there are duplicates (RBF flow)', () => {
        const state = createDeviceState([
            'ButtonRequest_ConfirmOutput',
            'ButtonRequest_ConfirmOutput',
            'ButtonRequest_SignTx',
        ]);

        expect(selectSendFormReviewButtonRequestsCount(state, 'btc' as any, 0)).toBe(2);
    });

    it('subtracts 1 for cardano network (legacy behavior)', () => {
        const state = createDeviceState(['ButtonRequest_ConfirmOutput', 'ButtonRequest_SignTx']);

        // For cardano, every code passes the filter, and the result is length - 1.
        expect(selectSendFormReviewButtonRequestsCount(state, 'ada' as any)).toBe(1);
    });
});

describe('selectSendFormReviewLastButtonCode', () => {
    it('returns null when symbol is undefined', () => {
        const state = createDeviceState(['ButtonRequest_ConfirmOutput']);

        expect(selectSendFormReviewLastButtonCode(state, undefined)).toBeNull();
    });

    it('returns the last filtered button code', () => {
        const state = createDeviceState(['ButtonRequest_ConfirmOutput', 'ButtonRequest_SignTx']);

        expect(selectSendFormReviewLastButtonCode(state, 'btc' as any)).toBe(
            'ButtonRequest_SignTx',
        );
    });

    it('returns null when the filtered list is empty', () => {
        const state = createDeviceState([]);

        expect(selectSendFormReviewLastButtonCode(state, 'btc' as any)).toBeNull();
    });
});
