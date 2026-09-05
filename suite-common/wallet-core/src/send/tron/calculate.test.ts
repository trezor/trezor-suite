import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type ExternalOutput } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import { calculate } from './calculate';
import { calculateRawContractCall } from './calculateRawContractCall';
import { calculateTrc20Transfer } from './calculateTrc20Transfer';
import { calculateTrxTransfer } from './calculateTrxTransfer';
import { type EstimateFeeLevel } from './types';

jest.mock('./calculateRawContractCall');
jest.mock('./calculateTrc20Transfer');
jest.mock('./calculateTrxTransfer');

const trxSymbol = asNetworkSymbol('trx');
const output = {
    type: 'payment',
    address: 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr',
    amount: '0',
} as ExternalOutput;
const feeLevel = { feePerTx: '0', feePerUnit: '0', feeLimit: '0' } as EstimateFeeLevel;
const token = { contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' } as TokenInfo;

describe('calculate – input routing', () => {
    afterEach(() => jest.clearAllMocks());

    it('routes to raw contract call when userCallDataHex is present, even if a token is set', () => {
        calculate('1000', output, feeLevel, trxSymbol, 300, false, token, false, '095ea7b3aa');

        expect(calculateRawContractCall).toHaveBeenCalledTimes(1);
        expect(calculateTrc20Transfer).not.toHaveBeenCalled();
        expect(calculateTrxTransfer).not.toHaveBeenCalled();
    });

    it('routes to TRC-20 transfer when only a token is present', () => {
        calculate('1000', output, feeLevel, trxSymbol, 300, false, token, false, undefined);

        expect(calculateTrc20Transfer).toHaveBeenCalledTimes(1);
        expect(calculateRawContractCall).not.toHaveBeenCalled();
    });

    it('routes to TRX transfer when neither token nor calldata is present', () => {
        calculate('1000', output, feeLevel, trxSymbol, 300, false, undefined, false, undefined);

        expect(calculateTrxTransfer).toHaveBeenCalledTimes(1);
        expect(calculateRawContractCall).not.toHaveBeenCalled();
        expect(calculateTrc20Transfer).not.toHaveBeenCalled();
    });
});
