import { type AdaPools } from '@suite-common/earn-staking-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { PROTO } from '@trezor/connect';

import { prepareTxPlan } from './stakeFormCardanoActions';

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

describe('prepareTxPlan', () => {
    beforeEach(() => {
        cardanoComposeTransactionMock.mockReset();
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
                expect.objectContaining({ type: PROTO.CardanoCertificateType.STAKE_REGISTRATION }),
                expect.objectContaining({ type: PROTO.CardanoCertificateType.STAKE_DELEGATION }),
            ]),
        );
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
});
