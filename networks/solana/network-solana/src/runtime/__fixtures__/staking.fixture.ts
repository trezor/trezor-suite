import { address, getBase64Decoder } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS, getStakeStateAccountEncoder } from '@solana-program/stake';

import { EVERSTAKE_SOLANA_DEVNET_VALIDATOR } from '../../constants';

export const getSolanaValidatorFixtures = [
    {
        description: 'should return mainnet validator address for Mainnet Network.',
        symbol: 'sol',
        result: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
    },
    {
        description: 'should return devnet validator address for Devnet Network.',
        symbol: 'dsol',
        result: 'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN',
    },
] as const;

export const mockNow = new Date('2026-10-27T00:00:00.000Z');
export const mockSender = address('4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi');

const MOCK_EPOCH = 900;
const MOCK_RENT_EXEMPT_RESERVE = 2_282_880;
const EPOCH_MAX = 18_446_744_073_709_551_615n;

type MockStakeAccountParams = {
    pubkey: string;
    stake: number;
    deactivationEpoch: number | bigint;
};

const mockStakeAccount = ({ pubkey, stake, deactivationEpoch }: MockStakeAccountParams) => ({
    pubkey,
    account: {
        data: [
            getBase64Decoder().decode(
                getStakeStateAccountEncoder().encode({
                    state: {
                        __kind: 'Stake',
                        fields: [
                            {
                                rentExemptReserve: MOCK_RENT_EXEMPT_RESERVE,
                                authorized: { staker: mockSender, withdrawer: mockSender },
                                lockup: {
                                    unixTimestamp: 0,
                                    epoch: 0,
                                    custodian: address('11111111111111111111111111111111'),
                                },
                            },
                            {
                                delegation: {
                                    voterPubkey: address(EVERSTAKE_SOLANA_DEVNET_VALIDATOR),
                                    stake,
                                    activationEpoch: 800,
                                    deactivationEpoch,
                                    reserved: [0, 0, 0, 0, 0, 0, 0, 0],
                                },
                                creditsObserved: 0,
                            },
                            { bits: 0 },
                        ],
                    },
                }),
            ),
            'base64',
        ],
        executable: false,
        lamports: stake + MOCK_RENT_EXEMPT_RESERVE,
        owner: STAKE_PROGRAM_ADDRESS,
        rentEpoch: 0,
        space: 200,
    },
});

const latestBlockhashResult = {
    context: { slot: 1 },
    value: {
        blockhash: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR',
        lastValidBlockHeight: 100,
    },
};

const activeStakeAccount = mockStakeAccount({
    pubkey: 'CktRuQ2mttgRGkXJtyksdKHjUdc2C4TgDzyB98oEzy8',
    stake: 2_000_000_000,
    deactivationEpoch: EPOCH_MAX,
});

const largerActiveStakeAccount = mockStakeAccount({
    pubkey: 'GgBaCs3NCBuZN12kCJgAW63ydqohFkHEdfdEXBPzLHq',
    stake: 5_000_000_000,
    deactivationEpoch: EPOCH_MAX,
});

const deactivatedStakeAccount = mockStakeAccount({
    pubkey: 'LbUiWL3xVV8hTFYBVdbTNrpDo41NKS6o3LHHuDzjfcY',
    stake: 3_000_000_000,
    deactivationEpoch: 850,
});

// Expected messages were built with @solana-program/stake 0.9.0, the last release whose stake
// account layout matches the firmware definitions.
export const stakeTransactionFixtures = {
    stake: {
        rpcResults: {
            getMinimumBalanceForRentExemption: MOCK_RENT_EXEMPT_RESERVE,
            getLatestBlockhash: latestBlockhashResult,
        },
        message:
            '800100080a0101010101010101010101010101010101010101010101010101010101010101e2c1afbc18398ef34b5cb48812c7f873d55c616aedfaa50a20ef95b3017e94a800000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a40000000ea1a2a344a8f706360bf067dc7465fe5db8354dd88c12c94956caad628cfddef06a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a1d817a502050b680791e6ce6db88e1e5b7150f61fc6790a4eb4d10000000006a7d51718c774c928566398691d5eb68b5eb8a39b4b6d5c73555b210000000006a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a0000000006a7d517193584d0feed9bb3431d13206be544281b57b8566cc5375ff400000002020202020202020202020202020202020202020202020202020202020202020503000903a08601000000000003000502400d03000203000100750300000001010101010101010101010101010101010101010101010101010101010101011900000000000000657665727374616b6520313a31373933303539323030303030809fbd3b00000000c80000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc000000000050201087400000000010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000506010407090600040200000000',
    },
    unstake: {
        rpcResults: {
            getProgramAccounts: [largerActiveStakeAccount, activeStakeAccount],
            getEpochInfo: { epoch: MOCK_EPOCH },
            getLatestBlockhash: latestBlockhashResult,
        },
        message:
            '80010003060101010101010101010101010101010101010101010101010101010101010101030303030303030303030303030303030303030303030303030303030303030304040404040404040404040404040404040404040404040404040404040404040306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a7d51718c774c928566398691d5eb68b5eb8a39b4b6d5c73555b210000000002020202020202020202020202020202020202020202020202020202020202020403000903a08601000000000003000502400d0300040301050004050000000403020500040500000000',
    },
    unstakeWithSplit: {
        rpcResults: {
            getProgramAccounts: [largerActiveStakeAccount],
            getMinimumBalanceForRentExemption: MOCK_RENT_EXEMPT_RESERVE,
            getEpochInfo: { epoch: MOCK_EPOCH },
            getLatestBlockhash: latestBlockhashResult,
        },
        message:
            '80010004070101010101010101010101010101010101010101010101010101010101010101e2c1afbc18398ef34b5cb48812c7f873d55c616aedfaa50a20ef95b3017e94a8040404040404040404040404040404040404040404040404040404040404040400000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a7d51718c774c928566398691d5eb68b5eb8a39b4b6d5c73555b210000000002020202020202020202020202020202020202020202020202020202020202020604000903a08601000000000004000502400d0300030201006d0900000001010101010101010101010101010101010101010101010101010101010101011900000000000000657665727374616b6520313a31373933303539323030303030c80000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc000000000030200010c0200000080d522000000000005030201000c0300000000943577000000000503010600040500000000',
    },
    claim: {
        rpcResults: {
            getProgramAccounts: [deactivatedStakeAccount, activeStakeAccount],
            getEpochInfo: { epoch: MOCK_EPOCH },
            getLatestBlockhash: latestBlockhashResult,
        },
        message:
            '8001000406010101010101010101010101010101010101010101010101010101010101010105050505050505050505050505050505050505050505050505050505050505050306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a7d51718c774c928566398691d5eb68b5eb8a39b4b6d5c73555b210000000006a7d517193584d0feed9bb3431d13206be544281b57b8566cc5375ff400000002020202020202020202020202020202020202020202020202020202020202020302000903a08601000000000002000502400d0300030501000405000c040000008033f3b20000000000',
    },
};
