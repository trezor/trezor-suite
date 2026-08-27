import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import { type AccountVotingDelegation } from '@suite-common/wallet-core';
import { type Account, type CardanoAction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { type CardanoCertificate, PROTO } from '@trezor/connect';

import { prepareTxPlan } from './stakeFormCardanoActions';

type CardanoComposeParams = { certificates: CardanoCertificate[] };

const mockCardanoComposeTransaction = jest.fn((_params: CardanoComposeParams) =>
    Promise.resolve({ success: true, payload: [{ type: 'final' }] }),
);

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: {
        cardanoComposeTransaction: (params: CardanoComposeParams) =>
            mockCardanoComposeTransaction(params),
    },
}));

// A valid CIP-105 dRep id that is not Everstake's, so the certificate says which one was honored.
const ANOTHER_DREP = {
    bech32: 'drep14w46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46kxzm6ac',
    hex: 'abababababababababababababababababababababababababababab',
};

const EVERSTAKE_VOTE_DELEGATION = {
    keyHash: CARDANO_EVERSTAKE_DREP.hex,
    scriptHash: undefined,
    type: PROTO.CardanoDRepType.KEY_HASH,
};

const createCardanoAccount = (descriptor: string): Account =>
    mockWalletAccount(
        {
            symbol: 'ada',
            descriptor: asAccountDescriptor(descriptor),
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
        // mockWalletAccount still maps 'ada' to the bitcoin defaults.
        networkSpecificDefaultCardano,
    );

const account = createCardanoAccount('adaAccountA');
const otherAccount = createCardanoAccount('adaAccountB');

const getSignedDrep = async (action: CardanoAction, votingDelegation?: AccountVotingDelegation) => {
    await prepareTxPlan(account, action, [], votingDelegation);

    const params = mockCardanoComposeTransaction.mock.calls.at(-1)?.[0];

    return params?.certificates?.find(
        certificate => certificate.type === PROTO.CardanoCertificateType.VOTE_DELEGATION,
    )?.dRep;
};

describe('prepareTxPlan voting delegation', () => {
    beforeEach(() => {
        mockCardanoComposeTransaction.mockClear();
    });

    it.each(['delegate', 'voteDelegate'] as const)(
        'honors a dRep confirmed for the composed account (%s)',
        async action => {
            const dRep = await getSignedDrep(action, {
                accountKey: account.key,
                option: { type: 'another_drep', drepId: ANOTHER_DREP.bech32 },
            });

            expect(dRep).toEqual({
                keyHash: ANOTHER_DREP.hex,
                scriptHash: undefined,
                type: PROTO.CardanoDRepType.KEY_HASH,
            });
        },
    );

    it.each(['delegate', 'voteDelegate'] as const)(
        'falls back to Everstake when the dRep was confirmed for another account (%s)',
        async action => {
            const dRep = await getSignedDrep(action, {
                accountKey: otherAccount.key,
                option: { type: 'another_drep', drepId: ANOTHER_DREP.bech32 },
            });

            expect(dRep).toEqual(EVERSTAKE_VOTE_DELEGATION);
        },
    );

    it('falls back to Everstake when no dRep was confirmed', async () => {
        expect(await getSignedDrep('voteDelegate')).toEqual(EVERSTAKE_VOTE_DELEGATION);
    });

    it('falls back to Everstake when the confirmed dRep id is not a valid bech32 dRep', async () => {
        const dRep = await getSignedDrep('voteDelegate', {
            accountKey: account.key,
            option: { type: 'another_drep', drepId: 'drep1invalid' },
        });

        expect(dRep).toEqual(EVERSTAKE_VOTE_DELEGATION);
    });

    it('delegates to Everstake when the Everstake option is confirmed', async () => {
        const dRep = await getSignedDrep('voteDelegate', {
            accountKey: account.key,
            option: { type: 'everstake' },
        });

        expect(dRep).toEqual(EVERSTAKE_VOTE_DELEGATION);
    });
});
