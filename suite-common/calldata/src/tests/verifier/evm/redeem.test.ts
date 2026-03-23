import { BigNumber } from '@trezor/utils';

import { buildRedeem } from '../../../builder/evm/redeem';
import { asEvmAddress } from '../../../types/evm';
import { Verifier } from '../../../verifier';

const SENDER = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const RECEIVER = SENDER;
const OWNER = SENDER;
const SHARES = 1000000n;

const redeemHex = buildRedeem(
    {
        shares: new BigNumber(SHARES.toString()),
        receiver: RECEIVER,
        owner: OWNER,
    },
    { sender: SENDER },
).data!;

describe('verifyRedeem', () => {
    it('returns isValid true on full match', () => {
        expect(
            Verifier.evm.erc4626.redeem(redeemHex, {
                shares: SHARES,
                receiver: RECEIVER,
                owner: OWNER,
            }),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('returns VALUE_MISMATCH on shares mismatch', () => {
        expect(
            Verifier.evm.erc4626.redeem(redeemHex, {
                shares: 999n,
                receiver: RECEIVER,
                owner: OWNER,
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'shares' }] });
    });

    it('returns isValid true when partial checked fields match', () => {
        expect(
            Verifier.evm.erc4626.redeem(
                redeemHex,
                { shares: 999n, receiver: RECEIVER, owner: OWNER },
                ['receiver', 'owner'],
            ),
        ).toEqual({ isValid: true, issues: [] });
    });
});
