import { BigNumber } from '@trezor/utils';

import { buildWithdraw } from '../../../builder/evm/withdraw';
import { asEvmAddress } from '../../../types/evm';
import { Verifier } from '../../../verifier';

const SENDER = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const RECEIVER = SENDER;
const OWNER = SENDER;
const ASSETS = 1000000n;

const withdrawHex = buildWithdraw(
    {
        assets: new BigNumber(ASSETS.toString()),
        receiver: RECEIVER,
        owner: OWNER,
    },
    { sender: SENDER },
).data!;

describe('verifyWithdraw', () => {
    it('returns isValid true on full match', () => {
        expect(
            Verifier.evm.erc4626.withdraw(withdrawHex, {
                assets: ASSETS,
                receiver: RECEIVER,
                owner: OWNER,
            }),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('returns VALUE_MISMATCH on full mismatch', () => {
        expect(
            Verifier.evm.erc4626.withdraw(withdrawHex, {
                assets: 999n,
                receiver: RECEIVER,
                owner: OWNER,
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'assets' }] });
    });

    it('returns isValid true when partial checked fields match', () => {
        expect(
            Verifier.evm.erc4626.withdraw(
                withdrawHex,
                { assets: 999n, receiver: RECEIVER, owner: OWNER },
                ['receiver', 'owner'],
            ),
        ).toEqual({ isValid: true, issues: [] });
    });
});
