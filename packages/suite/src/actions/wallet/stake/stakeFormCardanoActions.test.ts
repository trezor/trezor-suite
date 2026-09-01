import { type AdaPools } from '@suite-common/earn-staking-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import type { VotingDelegationOption } from '@suite-common/wallet-core';
import { type Account, type CardanoAction } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type CardanoCertificate, PROTO } from '@trezor/connect';

import { CardanoComposeError, prepareTxPlan } from './stakeFormCardanoActions';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: {
            ...actual.default,
            cardanoComposeTransaction: jest.fn(),
        },
    };
});

const PREDEFINED_DREP_ID = 'drep_always_abstain';
const NON_EVERSTAKE_POOL_ID = 'pool1pu5jlj4q9w9jlxeu370a3c9myx47md5j5m2str0naunn2q3lkdy';

const createCardanoAccount = ({
    drepId,
    isStakingActive = true,
}: {
    drepId: string | null;
    isStakingActive?: boolean;
}): Account =>
    ({
        key: 'ada-account-key',
        index: 0,
        symbol: 'ada',
        networkType: 'cardano',
        descriptor: 'ada-descriptor',
        utxo: [],
        addresses: {
            change: [{ address: 'addr-change', path: "m/1852'/1815'/0'/1/0", transfers: 0 }],
            used: [],
            unused: [],
        },
        misc: {
            staking: {
                address: 'stake-address',
                rewards: '0',
                isActive: isStakingActive,
                poolId: NON_EVERSTAKE_POOL_ID,
                drep: drepId === null ? null : { drep_id: drepId },
            },
        },
    }) as unknown as Account;

const migratePool = (account: Account, votingDelegation: VotingDelegationOption) =>
    prepareTxPlan({ account, action: 'delegate', cardanoPools: [], votingDelegation });

const getCertificateTypes = (txData: Awaited<ReturnType<typeof prepareTxPlan>>) =>
    txData?.certificates.map(certificate => certificate.type);

const cardanoComposeTransactionMock = TrezorConnect.cardanoComposeTransaction as jest.Mock;

const CHANGE_ADDRESS = {
    address: 'addr1change',
    path: "m/1852'/1815'/0'/1/0",
    transfers: 0,
    balance: '0',
    sent: '0',
    received: '0',
};

const cardanoPools: AdaPools['pools'] = [];

const mockNeverStakedAccount = (): Account =>
    mockWalletAccount(
        {
            symbol: asNetworkSymbol('ada'),
            addresses: { change: [CHANGE_ADDRESS], used: [], unused: [] },
            utxo: [],
        },
        {
            ...networkSpecificDefaultCardano,
            misc: {
                staking: { address: '', isActive: false, rewards: '', poolId: null, drep: null },
            },
        },
    );

const mockComposeSuccess = () => {
    cardanoComposeTransactionMock.mockResolvedValue({
        success: true,
        payload: [{ type: 'final', fee: '174301', deposit: '2000000' }],
    });
};

const getVoteDelegationCertificate = () => {
    const [params] = cardanoComposeTransactionMock.mock.calls.at(-1) ?? [];

    return params?.certificates?.find(
        (certificate: CardanoCertificate) =>
            certificate.type === PROTO.CardanoCertificateType.VOTE_DELEGATION,
    );
};

const prepare = (action: CardanoAction, votingDelegation?: VotingDelegationOption) =>
    prepareTxPlan({
        account: mockWalletAccount(
            {
                symbol: 'ada',
                index: 0,
                balance: '10000000',
                availableBalance: '10000000',
                utxo: [],
                addresses: {
                    change: [
                        {
                            address: 'addr1_change',
                            path: "m/1852'/1815'/0'/1/0",
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                    used: [],
                    unused: [],
                },
            },
            {
                ...networkSpecificDefaultCardano,
                misc: {
                    staking: {
                        address: 'stake1_address',
                        isActive: true,
                        rewards: '1000000',
                        poolId: null,
                        drep: null,
                    },
                },
            },
        ),
        action,
        cardanoPools: [],
        votingDelegation,
    });

const CUSTOM_DREP_BECH32 = 'drep14w46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46kxzm6ac';
const CUSTOM_DREP_HEX = 'abababababababababababababababababababababababababababab';

describe('prepareTxPlan', () => {
    beforeEach(() => {
        cardanoComposeTransactionMock.mockReset();

        jest.mocked(TrezorConnect.cardanoComposeTransaction).mockResolvedValue({
            success: true,
            payload: [{ type: 'final' }],
        } as unknown as Awaited<ReturnType<typeof TrezorConnect.cardanoComposeTransaction>>);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('composes a delegation for an account that has no staking address and no rewards yet', async () => {
        mockComposeSuccess();

        const result = await prepareTxPlan({
            account: mockNeverStakedAccount(),
            action: 'delegate',
            cardanoPools,
        });

        expect(result?.txPlan).toEqual({ type: 'final', fee: '174301', deposit: '2000000' });
        expect(cardanoComposeTransactionMock).toHaveBeenCalledTimes(1);
        expect(cardanoComposeTransactionMock.mock.calls[0][0].certificates).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: PROTO.CardanoCertificateType.STAKE_REGISTRATION,
                }),
                expect.objectContaining({
                    type: PROTO.CardanoCertificateType.STAKE_DELEGATION,
                }),
            ]),
        );
    });

    it('rejects with the error code only, so a rejected payload cannot leave the device', async () => {
        const utxoAddress = 'addr1q9utxo';
        cardanoComposeTransactionMock.mockResolvedValue({
            success: false,
            error: {
                code: 'Failure_UnknownCode',
                message: `Invalid parameter "account.utxo" (= [{"address":"${utxoAddress}"}]): Expected string`,
            },
        });

        const rejection = await prepareTxPlan({
            account: mockNeverStakedAccount(),
            action: 'delegate',
            cardanoPools,
        }).catch((error: unknown) => error);

        expect(rejection).toBeInstanceOf(CardanoComposeError);
        expect(rejection).toMatchObject({ code: 'Failure_UnknownCode' });
        expect((rejection as Error).message).not.toContain(utxoAddress);
    });

    it('does not compose a withdrawal when there is nothing to withdraw', async () => {
        mockComposeSuccess();

        const result = await prepareTxPlan({
            account: mockNeverStakedAccount(),
            action: 'withdrawal',
            cardanoPools,
        });

        expect(result).toBeNull();
        expect(cardanoComposeTransactionMock).not.toHaveBeenCalled();
    });

    it('composes no vote delegation certificate when the current delegation is kept, so a predefined DRep survives a pool migration', async () => {
        const account = createCardanoAccount({ drepId: PREDEFINED_DREP_ID });

        const certificateTypes = getCertificateTypes(
            await migratePool(account, { type: 'current' }),
        );

        expect(certificateTypes).not.toContain(PROTO.CardanoCertificateType.VOTE_DELEGATION);
        expect(certificateTypes).toContain(PROTO.CardanoCertificateType.STAKE_DELEGATION);
    });

    it('composes a vote delegation certificate for the Everstake option', async () => {
        const account = createCardanoAccount({ drepId: PREDEFINED_DREP_ID });

        const certificateTypes = getCertificateTypes(
            await migratePool(account, { type: 'everstake' }),
        );

        expect(certificateTypes).toContain(PROTO.CardanoCertificateType.VOTE_DELEGATION);
    });

    it('composes a vote delegation certificate for an unregistered account, which has no live delegation to keep', async () => {
        const account = createCardanoAccount({
            drepId: PREDEFINED_DREP_ID,
            isStakingActive: false,
        });

        const certificateTypes = getCertificateTypes(
            await migratePool(account, { type: 'current' }),
        );

        expect(certificateTypes).toContain(PROTO.CardanoCertificateType.VOTE_DELEGATION);
    });

    it('builds nothing for a vote delegation that keeps the current delegation, leaving nothing to sign', async () => {
        const account = createCardanoAccount({ drepId: PREDEFINED_DREP_ID });

        const txData = await prepareTxPlan({
            account,
            action: 'voteDelegate',
            cardanoPools: [],
            votingDelegation: { type: 'current' },
        });

        expect(txData).toBeNull();
        expect(TrezorConnect.cardanoComposeTransaction).not.toHaveBeenCalled();
    });

    describe.each(['delegate', 'voteDelegate'] as const)('%s', action => {
        it.each(['not-a-drep', '', CARDANO_EVERSTAKE_DREP.hex])(
            'returns null without composing when the custom drepId %p is invalid',
            async drepId => {
                await expect(prepare(action, { type: 'another_drep', drepId })).resolves.toBeNull();
                expect(cardanoComposeTransactionMock).not.toHaveBeenCalled();
            },
        );

        it('delegates the vote to the custom DRep when the drepId is valid', async () => {
            await prepare(action, { type: 'another_drep', drepId: CUSTOM_DREP_BECH32 });

            expect(getVoteDelegationCertificate()?.dRep).toEqual({
                type: PROTO.CardanoDRepType.KEY_HASH,
                keyHash: CUSTOM_DREP_HEX,
                scriptHash: undefined,
            });
        });

        it.each([{ type: 'everstake' } as const, undefined])(
            'delegates the vote to Everstake for %p',
            async votingDelegation => {
                await prepare(action, votingDelegation);

                expect(getVoteDelegationCertificate()?.dRep).toEqual({
                    type: PROTO.CardanoDRepType.KEY_HASH,
                    keyHash: CARDANO_EVERSTAKE_DREP.hex,
                    scriptHash: undefined,
                });
            },
        );
    });

    describe.each(['deregister', 'withdrawal'] as const)('%s', action => {
        it('composes despite an invalid custom drepId', async () => {
            await expect(
                prepare(action, { type: 'another_drep', drepId: 'not-a-drep' }),
            ).resolves.not.toBeNull();
            expect(getVoteDelegationCertificate()).toBeUndefined();
        });
    });
});
