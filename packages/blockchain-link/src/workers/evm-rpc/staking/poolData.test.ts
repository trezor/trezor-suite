import { type PublicClient, encodeAbiParameters, parseAbiParameters } from 'viem';

import { getStakingPoolData } from './poolData';

const ADDRESS = '0x1234567890123456789012345678901234567890' as const;
const EVERSTAKE_ACCOUNTING = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';

const encodeUint = (value: bigint) => encodeAbiParameters(parseAbiParameters('uint256'), [value]);
const encodeUintPair = (a: bigint, b: bigint) =>
    encodeAbiParameters(parseAbiParameters('uint256, uint256'), [a, b]);

const AGGREGATE3_RESULT = parseAbiParameters('(bool success, bytes returnData)[]');

const encodeAggregate3 = (entries: { success: boolean; returnData: `0x${string}` }[]) =>
    encodeAbiParameters(AGGREGATE3_RESULT, [entries]);

const succeeded = (returnData: `0x${string}`[]) =>
    returnData.map(data => ({ success: true, returnData: data }));

type Balances = {
    pending?: bigint;
    pendingDeposited?: bigint;
    deposited?: bigint;
    withdrawTotal?: bigint;
    claimable?: bigint;
    restaked?: bigint;
    autocompound?: bigint;
};

// Order matches ACCOUNTING_FUNCTIONS in poolData.ts.
const balances = ({
    pending = 1n,
    pendingDeposited = 2n,
    deposited = 3n,
    withdrawTotal = 4n,
    claimable = 5n,
    restaked = 6n,
    autocompound = 7n,
}: Balances = {}): `0x${string}`[] => [
    encodeUint(pending),
    encodeUint(pendingDeposited),
    encodeUint(deposited),
    encodeUintPair(withdrawTotal, claimable),
    encodeUint(restaked),
    encodeUint(autocompound),
];

const ZERO: Balances = {
    pending: 0n,
    pendingDeposited: 0n,
    deposited: 0n,
    withdrawTotal: 0n,
    claimable: 0n,
    restaked: 0n,
    autocompound: 0n,
};

const createClient = ({
    chainId = 1,
    multicall3Deployed = true,
    returnData = balances(),
}: {
    chainId?: number;
    multicall3Deployed?: boolean;
    returnData?: `0x${string}`[];
} = {}) => {
    let individualIndex = 0;

    const call = jest.fn();
    call.mockImplementation(({ to }: { to: string }) => {
        if (to === MULTICALL3) {
            return Promise.resolve({ data: encodeAggregate3(succeeded(returnData)) });
        }

        const data = returnData[individualIndex];
        individualIndex += 1;

        return Promise.resolve({ data });
    });

    const client = {
        getChainId: jest.fn().mockResolvedValue(chainId),
        getCode: jest.fn().mockResolvedValue(multicall3Deployed ? '0x6080604052' : '0x'),
        call,
    };

    return { client, asPublicClient: client as unknown as PublicClient };
};

describe('getStakingPoolData', () => {
    it('reads every accounting balance in a single Multicall3 request', async () => {
        const { client, asPublicClient } = createClient();

        const pools = await getStakingPoolData(asPublicClient, ADDRESS);

        expect(client.call).toHaveBeenCalledTimes(1);
        expect(client.call.mock.calls[0]?.[0].to).toBe(MULTICALL3);

        expect(pools).toEqual([
            {
                contract: EVERSTAKE_ACCOUNTING,
                name: 'Everstake',
                pendingBalance: '1',
                pendingDepositedBalance: '2',
                depositedBalance: '3',
                withdrawTotalAmount: '4',
                claimableAmount: '5',
                restakedReward: '6',
                autocompoundBalance: '7',
            },
        ]);
    });

    it('falls back to one request per balance without Multicall3', async () => {
        const { client, asPublicClient } = createClient({ multicall3Deployed: false });

        const pools = await getStakingPoolData(asPublicClient, ADDRESS);

        expect(client.call).toHaveBeenCalledTimes(6);
        expect(
            client.call.mock.calls.every(
                ([{ to }]: [{ to: string }]) => to === EVERSTAKE_ACCOUNTING,
            ),
        ).toBe(true);
        expect(pools?.[0]?.depositedBalance).toBe('3');
    });

    it('resolves the chain id once per client', async () => {
        const { client, asPublicClient } = createClient();

        await getStakingPoolData(asPublicClient, ADDRESS);
        await getStakingPoolData(asPublicClient, ADDRESS);

        expect(client.getChainId).toHaveBeenCalledTimes(1);
        expect(client.call).toHaveBeenCalledTimes(2);
    });

    it('makes no contract request on a chain without a known pool', async () => {
        const { client, asPublicClient } = createClient({ chainId: 137 });

        await expect(getStakingPoolData(asPublicClient, ADDRESS)).resolves.toBeUndefined();

        expect(client.call).not.toHaveBeenCalled();
    });

    it('returns undefined when every balance is zero', async () => {
        const { asPublicClient } = createClient({ returnData: balances(ZERO) });

        await expect(getStakingPoolData(asPublicClient, ADDRESS)).resolves.toBeUndefined();
    });

    it('returns undefined when a batched balance reverts', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValue({
            data: encodeAggregate3([
                { success: false, returnData: '0x' },
                ...succeeded(balances().slice(1)),
            ]),
        });
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(getStakingPoolData(asPublicClient, ADDRESS)).resolves.toBeUndefined();
    });
});
