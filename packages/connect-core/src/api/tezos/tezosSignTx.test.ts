import type { TezosParametersManager } from '@trezor/connect-common';

import { createTx } from './tezosSignTx';

const PATH = [0x80000000 + 44, 0x80000000 + 1729, 0x80000000];
const BRANCH = 'BMdPMLXNyMTDp4vR6g7y8mWPk7KZbjoXH3gyWD1Tze43UE3BaPm';
const BAKER = 'tz1boot1pK9h2BVGXdyvfQSv8kd1LQM6H889';

const createManagerTx = (parameters_manager: TezosParametersManager, amount = 0) =>
    createTx(PATH, BRANCH, {
        transaction: {
            source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            destination: 'KT1SBj7e8ZhV2VvJtoc73dNRDLRJ9P6VjuVN',
            amount,
            counter: 292,
            fee: 10000,
            gas_limit: 36283,
            storage_limit: 0,
            parameters_manager,
        },
    });

describe('createTx parameters_manager', () => {
    it('sends cancel_delegate when it is true', () => {
        expect(createManagerTx({ cancel_delegate: true }).transaction?.parameters_manager).toEqual({
            cancel_delegate: true,
        });
    });

    it.each([false, null, undefined])(
        'keeps set_delegate when cancel_delegate is %p',
        cancelDelegate => {
            expect(
                createManagerTx({
                    set_delegate: BAKER,
                    // @ts-expect-error The schema also accepts null for an optional field.
                    cancel_delegate: cancelDelegate,
                }).transaction?.parameters_manager,
            ).toEqual({ set_delegate: expect.any(Uint8Array) });
        },
    );

    it.each<TezosParametersManager>([
        { cancel_delegate: false },
        { set_delegate: BAKER, transfer: { destination: BAKER, amount: 200 } },
    ])('rejects %j, which is not exactly one manager operation', parametersManager => {
        expect(() => createManagerTx(parametersManager)).toThrow(
            expect.objectContaining({ code: 'Method_InvalidParameter' }),
        );
    });

    it('rejects a manager operation with a non-zero amount', () => {
        expect(() => createManagerTx({ set_delegate: BAKER }, 1)).toThrow(
            expect.objectContaining({ code: 'Method_InvalidParameter' }),
        );
    });
});
