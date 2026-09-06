import { type ERROR } from '../constants';

type ErrorTypeKeys = keyof typeof ERROR;
type ErrorObjectType = (typeof ERROR)[ErrorTypeKeys];

export class CoinSelectionError extends Error {
    code: ErrorObjectType['code'];
    constructor(errorObject: ErrorObjectType) {
        super(errorObject.message);
        this.name = 'CoinSelectionError';
        this.code = errorObject.code;
        this.message = errorObject.message;
        Object.setPrototypeOf(this, CoinSelectionError.prototype);
    }
}
