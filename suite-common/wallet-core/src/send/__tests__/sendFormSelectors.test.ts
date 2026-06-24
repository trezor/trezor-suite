import { type DeviceRootState } from '@suite-common/device';
import { type ButtonRequest } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { PAYMENT_REQUEST_BUTTON_NAMES } from '../sendFormConstants';
import {
    selectSendFormButtonRequestCodes,
    selectSendFormReviewButtonRequestsCount,
    selectSendFormReviewLastButtonCode,
} from '../sendFormSelectors';

const stateWith = (buttonRequests: ButtonRequest[]): DeviceRootState =>
    ({
        device: {
            selectedDevice: mockSuiteDevice({ buttonRequests }),
        },
    }) as unknown as DeviceRootState;

const SLIP24_SEQUENCE: ButtonRequest[] = [
    { code: 'ButtonRequest_Other', name: 'confirm_payment_request' },
    { code: 'ButtonRequest_Other', name: 'confirm_trade' },
    { code: 'ButtonRequest_SignTx', name: 'confirm_total' },
];

describe('selectSendFormButtonRequestCodes', () => {
    it('counts SLIP-24 payment request screens (ButtonRequest_Other by name) on bitcoin', () => {
        PAYMENT_REQUEST_BUTTON_NAMES.forEach(name => {
            const codes = selectSendFormButtonRequestCodes(
                stateWith([{ code: 'ButtonRequest_Other', name }]),
                'btc',
            );
            expect(codes).toEqual(['ButtonRequest_Other']);
        });
    });

    it('ignores ButtonRequest_Other with an unrelated name on bitcoin', () => {
        expect(
            selectSendFormButtonRequestCodes(
                stateWith([
                    { code: 'ButtonRequest_Other', name: 'confirm_something_else' },
                    { code: 'ButtonRequest_Other' },
                ]),
                'btc',
            ),
        ).toEqual([]);
    });

    it('maps the full bitcoin SLIP-24 sequence to its codes in order', () => {
        expect(selectSendFormButtonRequestCodes(stateWith(SLIP24_SEQUENCE), 'btc')).toEqual([
            'ButtonRequest_Other',
            'ButtonRequest_Other',
            'ButtonRequest_SignTx',
        ]);
    });

    it('always counts ConfirmOutput and SignTx regardless of network', () => {
        const requests: ButtonRequest[] = [
            { code: 'ButtonRequest_ConfirmOutput' },
            { code: 'ButtonRequest_SignTx' },
        ];
        expect(selectSendFormButtonRequestCodes(stateWith(requests), 'btc')).toEqual([
            'ButtonRequest_ConfirmOutput',
            'ButtonRequest_SignTx',
        ]);
    });

    it('counts any ButtonRequest_Other on ethereum (by network, not name)', () => {
        expect(
            selectSendFormButtonRequestCodes(stateWith([{ code: 'ButtonRequest_Other' }]), 'eth'),
        ).toEqual(['ButtonRequest_Other']);
    });

    it('counts Other and ProtectCall on stellar', () => {
        expect(
            selectSendFormButtonRequestCodes(
                stateWith([{ code: 'ButtonRequest_Other' }, { code: 'ButtonRequest_ProtectCall' }]),
                'xlm',
            ),
        ).toEqual(['ButtonRequest_Other', 'ButtonRequest_ProtectCall']);
    });

    it('counts every button request on cardano', () => {
        expect(
            selectSendFormButtonRequestCodes(
                stateWith([
                    { code: 'ButtonRequest_PinEntry' },
                    { code: 'ButtonRequest_ConfirmOutput' },
                ]),
                'ada',
            ),
        ).toEqual(['ButtonRequest_PinEntry', 'ButtonRequest_ConfirmOutput']);
    });

    it('returns a stable reference for unchanged inputs', () => {
        const state = stateWith(SLIP24_SEQUENCE);
        expect(selectSendFormButtonRequestCodes(state, 'btc')).toBe(
            selectSendFormButtonRequestCodes(state, 'btc'),
        );
    });
});

describe('selectSendFormReviewButtonRequestsCount', () => {
    it('returns 0 when no symbol is provided', () => {
        expect(selectSendFormReviewButtonRequestsCount(stateWith(SLIP24_SEQUENCE))).toBe(0);
    });

    it('counts the full bitcoin SLIP-24 sequence as 3 steps', () => {
        expect(selectSendFormReviewButtonRequestsCount(stateWith(SLIP24_SEQUENCE), 'btc')).toBe(3);
    });

    it('subtracts one on cardano', () => {
        const state = stateWith([
            { code: 'ButtonRequest_ConfirmOutput' },
            { code: 'ButtonRequest_SignTx' },
        ]);
        expect(selectSendFormReviewButtonRequestsCount(state, 'ada')).toBe(1);
    });

    it('does not return a negative count for cardano without button requests', () => {
        expect(selectSendFormReviewButtonRequestsCount(stateWith([]), 'ada')).toBe(0);
    });

    it('drops one ConfirmOutput when decreasing an RBF output, without mutating the cached array', () => {
        const state = stateWith([
            { code: 'ButtonRequest_ConfirmOutput' },
            { code: 'ButtonRequest_ConfirmOutput' },
        ]);

        expect(selectSendFormReviewButtonRequestsCount(state, 'btc', 0)).toBe(1);
        // The memoized array must be untouched by the decrement above.
        expect(selectSendFormButtonRequestCodes(state, 'btc')).toHaveLength(2);
        // Without decreaseOutputId the full count is returned.
        expect(selectSendFormReviewButtonRequestsCount(state, 'btc')).toBe(2);
    });
});

describe('selectSendFormReviewLastButtonCode', () => {
    it('returns null when no symbol is provided', () => {
        expect(selectSendFormReviewLastButtonCode(stateWith(SLIP24_SEQUENCE))).toBeNull();
    });

    it('returns null when there are no relevant button requests', () => {
        expect(
            selectSendFormReviewLastButtonCode(stateWith([{ code: 'ButtonRequest_Other' }]), 'btc'),
        ).toBeNull();
    });

    it('returns the last relevant code', () => {
        expect(selectSendFormReviewLastButtonCode(stateWith(SLIP24_SEQUENCE), 'btc')).toBe(
            'ButtonRequest_SignTx',
        );
    });
});
