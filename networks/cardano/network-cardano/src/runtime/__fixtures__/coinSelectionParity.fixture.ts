// Deterministic coin-selection inputs used to verify that every Cardano Serialization Lib build
// (WASM on desktop/web, asm.js on mobile) produces identical transactions.
// Only cases that take the largest-first path are included; random-improve is not deterministic.
import type { types } from '@fivebinaries/coin-selection';

const BASE_ADDRESS =
    'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r';
const RECIPIENT =
    'addr1z90z7zqwhya6mpk5q929ur897g3pp9kkgalpreny8y304r2dcrtx0sf3dluyu4erzr3xtmdnzvcyfzekkuteu2xagx0qeva0pr';
const ACCOUNT_XPUB =
    'd507c8f866691bd96e131334c355188b1a1d0b2fa0ab11545075aab332d77d9eb19657ad13ee581b56b0f8d744d66ca356b93d42fe176b3de007d53e9c4c4e7a';
const STAKE_ADDRESS = 'stake1uya87zwnmax0v6nnn8ptqkl6ydx4522kpsc3l3wmf3yswygwx45el';
const POOL = 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973';
const POLICY_A = '95a427e384527065f2f8946f5e86320d0117839a5e98ea2c0b55fb00';
const POLICY_B = 'd894897411707efa755a76deb66d26dfd50593f2e70863e1661e98a0';
const TOKEN_B = `${POLICY_B}746f6b656e`;
const TTL = 150_000_000;

const hex = (value: number, length: number) => value.toString(16).padStart(length, '0');

const buildUtxos = (count: number): types.Utxo[] =>
    Array.from({ length: count }, (_, index) => {
        const amount: types.Asset[] = [
            { unit: 'lovelace', quantity: String(1_500_000 + index * 731_000) },
        ];
        if (index % 5 === 0) {
            amount.push({ unit: `${POLICY_A}${hex(index, 4)}`, quantity: String(10 + index) });
        }
        if (index % 7 === 0) {
            amount.push({ unit: TOKEN_B, quantity: String(1_000 * (index + 1)) });
        }

        return {
            address: BASE_ADDRESS,
            txHash: hex(index + 1, 8).repeat(8),
            outputIndex: index % 3,
            amount,
        };
    });

const baseParams = {
    utxos: buildUtxos(50),
    changeAddress: BASE_ADDRESS,
    certificates: [],
    withdrawals: [],
    accountPubKey: ACCOUNT_XPUB,
    ttl: TTL,
} satisfies Partial<types.CoinSelectionParams>;

export interface ParityCase {
    params: types.CoinSelectionParams;
    options: types.Options;
    expected: {
        fee: string;
        totalSpent: string;
        hash: string;
        size: number;
        serializedTxHash: string;
    };
}

export const witnesses = [
    {
        type: 1,
        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
        signature:
            '9d0abbf8a4b5e7f6c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8',
    },
];

export const parityCases: Record<string, ParityCase> = {
    delegationWithTokensAndWithdrawal: {
        params: {
            ...baseParams,
            outputs: [
                {
                    address: RECIPIENT,
                    amount: '3000000',
                    assets: [{ unit: TOKEN_B, quantity: '1500' }],
                },
            ],
            certificates: [{ type: 0 }, { type: 2, pool: POOL }, { type: 9, dRep: { type: 2 } }],
            withdrawals: [{ stakeAddress: STAKE_ADDRESS, amount: '1234567' }],
        },
        options: {},
        expected: {
            fee: '188953',
            totalSpent: '5188953',
            hash: '85c398493e69e9632c5e46e13bbe1fc6bdb4d3c5fb1ae696bdf0e51d5652ca4f',
            size: 759,
            serializedTxHash: 'b205004f25206cb8d7d634964cee6ee88224787f29442e64d98868fb92c5e98b',
        },
    },
    plainSend: {
        params: {
            ...baseParams,
            outputs: [{ address: RECIPIENT, amount: '12345678', assets: [] }],
        },
        options: { forceLargestFirstSelection: true },
        expected: {
            fee: '170429',
            totalSpent: '12516107',
            hash: '8873131e7e46331e2bef32ec4f8ebd3edde1635c02d95f684705b9be4ff8ff56',
            size: 338,
            serializedTxHash: '19be2111ac264e482b8395a42afc1bf36560bd613152d5eb790852a69a4ef3cd',
        },
    },
    sendMax: {
        params: {
            ...baseParams,
            outputs: [{ address: RECIPIENT, amount: undefined, assets: [], setMax: true }],
        },
        options: {},
        expected: {
            fee: '251609',
            totalSpent: '968979430',
            hash: '4dfac9e046d8481866b1fbec22fb83819b64df64ad9a8491ee7e4810ce182bb5',
            size: 2183,
            serializedTxHash: '6da4f1422969629ea4306dce5818da30db8220f41a830cab68888d283a233170',
        },
    },
};
