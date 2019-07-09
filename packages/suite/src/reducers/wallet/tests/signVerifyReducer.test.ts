import reducer from '@wallet-reducers/signVerifyReducer';

describe('sign verify reducer', () => {
    it('test initial state', () => {
        // @ts-ignore
        expect(reducer(undefined, {})).toEqual({
            signAddress: '',
            signMessage: '',
            signSignature: '',
            verifyAddress: '',
            verifyMessage: '',
            verifySignature: '',
            touched: [],
            errors: [],
        });
    });
});
