import type { SubscriptionAccountInfo } from '@trezor/blockchain-link-types';
import { tokenProgramsInfo } from '@trezor/network-solana/constants';
import type { SolanaAPI } from '@trezor/network-solana/types';

import { BlockchainLink } from '../../index';

import SolanaWorker from './index';

const descriptor = '2MLmmoKgCrxVEzMeGatnjdABYS5RXsQSNikcWrmnvQna';

const createApiMock = () => {
    const accountSubscriptions: string[] = [];
    const programSubscriptions: { programId: string; filters: unknown }[] = [];

    const noNotifications = {
        subscribe: () =>
            Promise.resolve({
                async *[Symbol.asyncIterator]() {},
            }),
    };

    const api = {
        rpcSubscriptions: {
            accountNotifications: (address: string) => {
                accountSubscriptions.push(address);

                return noNotifications;
            },
            programNotifications: (programId: string, { filters }: { filters: unknown }) => {
                programSubscriptions.push({ programId, filters });

                return noNotifications;
            },
        },
    } as unknown as SolanaAPI;

    return { api, accountSubscriptions, programSubscriptions };
};

const createTokenAccounts = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        contract: `mint-${i}`,
        accounts: [{ publicKey: `token-account-${i}`, balance: '1' }],
    }));

const subscribeAccount = async (account: SubscriptionAccountInfo) => {
    const mock = createApiMock();
    const worker = SolanaWorker();
    worker.tryConnect = () => Promise.resolve(mock.api);

    const blockchain = new BlockchainLink({
        name: 'Solana',
        worker: () => worker,
        server: ['dummyUrl'],
        debug: false,
    });

    const result = await blockchain.subscribe({ type: 'accounts', accounts: [account] });
    blockchain.dispose();

    return { ...mock, result };
};

describe('solana worker subscriptions', () => {
    it('subscribes each token program once instead of each token account', async () => {
        const account = {
            descriptor,
            tokens: createTokenAccounts(20),
        } as unknown as SubscriptionAccountInfo;

        const { result, accountSubscriptions, programSubscriptions } =
            await subscribeAccount(account);

        expect(result).toEqual({ subscribed: true });
        expect(accountSubscriptions).toEqual([descriptor]);
        expect(programSubscriptions.map(({ programId }) => programId)).toEqual(
            Object.values(tokenProgramsInfo).map(({ publicKey }) => publicKey),
        );
    });

    it('keeps the subscription count independent of how many tokens the account holds', async () => {
        const countSubscriptions = async (tokenCount: number) => {
            const { accountSubscriptions, programSubscriptions } = await subscribeAccount({
                descriptor,
                tokens: createTokenAccounts(tokenCount),
            } as unknown as SubscriptionAccountInfo);

            return accountSubscriptions.length + programSubscriptions.length;
        };

        // one account notification plus one program notification per token program
        const expected = 1 + Object.keys(tokenProgramsInfo).length;

        expect(await countSubscriptions(0)).toBe(expected);
        expect(await countSubscriptions(68)).toBe(expected);
    });

    it('filters token notifications by the owner offset of the token account layout', async () => {
        const { programSubscriptions } = await subscribeAccount({ descriptor });

        programSubscriptions.forEach(({ filters }) => {
            expect(filters).toEqual([
                { memcmp: { bytes: descriptor, encoding: 'base58', offset: 32n } },
            ]);
        });
    });
});
