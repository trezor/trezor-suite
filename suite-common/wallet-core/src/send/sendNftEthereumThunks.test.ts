import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    AddressDisplayOptions,
    type FormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect from '@trezor/connect';

import { type EthAccount, confirmedNonces } from './__fixtures__/evmFixtures';
import {
    type SignEthereumSendFormTransactionThunkState,
    composeEthereumTransactionFeeLevelsThunk,
    signEthereumSendFormTransactionThunk,
} from './sendFormEthereumThunks';

const SENDER = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';
const RECIPIENT = '0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96';
const CONTRACT = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85';
const TOKEN_ID = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

// Reference calldata from viem `encodeFunctionData`, independent of the builders.
const ERC721_DATA =
    '0x42842e0e0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3000000000000000000000000b836472d21991eb9842e15beae1af6c8b63d6a96ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(SENDER),
    availableBalance: '1000000000000000000',
    tokens: [{ standard: 'ERC721', contract: CONTRACT, decimals: 18, ids: ['7', TOKEN_ID] }],
}) as EthAccount;

const formState = (nftTokenId: string | undefined) =>
    ({
        outputs: [
            { type: 'payment', address: RECIPIENT, amount: '1', token: CONTRACT, nftTokenId },
        ],
        selectedFee: 'normal',
        options: ['broadcast'],
    }) as unknown as FormState;

const feeInfo = {
    blockHeight: 1,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal' as const, feePerUnit: '20', feeLimit: '21000', blocks: 2 }],
};

const initStore = () =>
    createTestCompositionRoot<void, SignEthereumSendFormTransactionThunkState & DeviceRootState>({
        preloadedState: {
            device: deviceInitialState,
            wallet: {
                transactions: { transactions: { [account.key]: confirmedNonces(1) } },
                settings: { addressDisplayType: AddressDisplayOptions.ORIGINAL },
            },
        },
    }).services.store;

describe('NFT send through the Ethereum send thunks', () => {
    let estimateMock: jest.SpyInstance;
    let signMock: jest.SpyInstance;

    beforeEach(() => {
        estimateMock = jest.spyOn(TrezorBlockchain, 'estimateFee').mockResolvedValue({
            success: true,
            payload: { levels: [{ feeLimit: '60000' }] },
        } as any);
        jest.spyOn(TrezorBlockchain, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '1' } },
        } as any);
        signMock = jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsigned' },
        } as any);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('estimates and signs safeTransferFrom against the contract', async () => {
        const store = initStore();
        const form = formState(TOKEN_ID);

        const levels = await store
            .dispatch(
                composeEthereumTransactionFeeLevelsThunk({
                    formState: form,
                    composeContext: { account, network: getNetwork(account.symbol), feeInfo },
                }),
            )
            .unwrap();

        expect(estimateMock.mock.calls[0][0].request.specific).toMatchObject({
            from: SENDER,
            to: CONTRACT,
            value: '0x0',
            data: ERC721_DATA,
        });

        const { normal } = levels;
        expect(normal).toMatchObject({ type: 'final', totalSpent: '1', token: { decimals: 0 } });

        await store
            .dispatch(
                signEthereumSendFormTransactionThunk({
                    formState: form,
                    precomposedTransaction: normal as any,
                    selectedAccount: account,
                    device: { path: '1', instance: 0, state: 'state@x:0' } as any,
                }),
            )
            .unwrap();

        expect(signMock.mock.calls[0][0].transaction).toMatchObject({
            to: CONTRACT,
            value: '0x00',
            data: ERC721_DATA,
        });
    });

    it('rejects an item the account does not hold', async () => {
        const levels = await initStore()
            .dispatch(
                composeEthereumTransactionFeeLevelsThunk({
                    formState: formState('8'),
                    composeContext: { account, network: getNetwork(account.symbol), feeInfo },
                }),
            )
            .unwrap();

        expect(levels.normal).toMatchObject({ type: 'error', error: 'AMOUNT_IS_NOT_ENOUGH' });
    });

    it('refuses to compose an NFT output without a token id', async () => {
        await expect(
            initStore()
                .dispatch(
                    composeEthereumTransactionFeeLevelsThunk({
                        formState: formState(undefined),
                        composeContext: { account, network: getNetwork(account.symbol), feeInfo },
                    }),
                )
                .unwrap(),
        ).rejects.toMatchObject({ error: 'fee-levels-compose-failed' });
        expect(estimateMock).not.toHaveBeenCalled();
    });
});
