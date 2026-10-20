import {
    buildClaimWithdrawRequestData,
    buildStakeData,
    buildUnstakeData,
    getUnstakeAmountFromCalldata,
    verifyEverstakeCalldata,
} from './everstakeCalldata';
import { WALLET_SDK_SOURCE, WALLET_SDK_SOURCE_MOBILE } from '../../../shared/stakingConstants';

describe(getUnstakeAmountFromCalldata.name, () => {
    it('recovers the ether amount encoded in unstake calldata', () => {
        expect(getUnstakeAmountFromCalldata(buildUnstakeData('1500000000000000000', 5))).toBe(
            '1.5',
        );
    });

    it('returns null for calldata that is not an unstake call', () => {
        expect(getUnstakeAmountFromCalldata(buildStakeData())).toBeNull();
        expect(getUnstakeAmountFromCalldata('0x1234')).toBeNull();
    });
});

describe(verifyEverstakeCalldata.name, () => {
    it('accepts calldata built for the same app', () => {
        expect(verifyEverstakeCalldata('stake', buildStakeData(), WALLET_SDK_SOURCE)).toEqual({
            isValid: true,
            issues: [],
        });
        expect(
            verifyEverstakeCalldata(
                'unstake',
                buildUnstakeData('1', 5, WALLET_SDK_SOURCE_MOBILE),
                WALLET_SDK_SOURCE_MOBILE,
            ),
        ).toEqual({ isValid: true, issues: [] });
        expect(
            verifyEverstakeCalldata('claim', buildClaimWithdrawRequestData(), WALLET_SDK_SOURCE),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('rejects calldata attributed to another app', () => {
        const result = verifyEverstakeCalldata(
            'stake',
            buildStakeData(WALLET_SDK_SOURCE_MOBILE),
            WALLET_SDK_SOURCE,
        );

        expect(result.isValid).toBe(false);
        expect(result.issues).toEqual([{ code: 'VALUE_MISMATCH', field: 'source' }]);
    });

    it('rejects calldata of a different operation', () => {
        const result = verifyEverstakeCalldata('unstake', buildStakeData(), WALLET_SDK_SOURCE);

        expect(result.isValid).toBe(false);
        expect(result.issues).toEqual([{ code: 'SIGNATURE_MISMATCH', field: null }]);
    });
});
