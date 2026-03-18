import { BigNumber } from '@trezor/utils';

import { buildDeposit } from '../../../builder/evm/deposit';
import { asEvmAddress } from '../../../types/evm';
import { Verifier } from '../../../verifier';

const SENDER = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const RECEIVER = SENDER;
const ASSETS = 1000000n;

const depositHex = buildDeposit(
    { assets: new BigNumber(ASSETS.toString()), receiver: RECEIVER },
    { sender: SENDER },
).data!;

describe('verifyDeposit', () => {
    it('returns isValid true on full match', () => {
        expect(
            Verifier.evm.erc4626.deposit(depositHex, { assets: ASSETS, receiver: RECEIVER }),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('returns VALUE_MISMATCH on full mismatch', () => {
        expect(
            Verifier.evm.erc4626.deposit(depositHex, {
                assets: ASSETS,
                receiver: '0x0000000000000000000000000000000000000001',
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'receiver' }] });
    });

    it('returns isValid true when partial checked fields match', () => {
        expect(
            Verifier.evm.erc4626.deposit(
                depositHex,
                { assets: ASSETS, receiver: '0x0000000000000000000000000000000000000001' },
                ['assets'],
            ),
        ).toEqual({ isValid: true, issues: [] });
    });
});
