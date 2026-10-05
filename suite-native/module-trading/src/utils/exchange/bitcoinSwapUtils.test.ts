import { type BtcSwapComposeTemplate } from 'invity-api';

import { deriveBitcoinSwapFromAddresses } from '@suite-common/trading';
import { type FeeInfo } from '@suite-common/wallet-types';
import { btc1NormalAccount, eth1NormalAccount } from '@suite-native/trading-fixtures';

import { getBitcoinSwapFromAddress, getBitcoinSwapMaxAmount } from './bitcoinSwapUtils';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    deriveBitcoinSwapFromAddresses: jest.fn(),
}));

const mockDeriveBitcoinSwapFromAddresses = jest.mocked(deriveBitcoinSwapFromAddresses);

const btcSwapComposeTemplate: BtcSwapComposeTemplate = {
    extraOutputs: [{ type: 'opreturn', dataHex: 'aa' }],
};

const feeInfo = {
    blockHeight: 1,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    feeLimit: 0,
    levels: [
        { label: 'high', feePerUnit: '10', blocks: 1 },
        { label: 'normal', feePerUnit: '5', blocks: 6 },
    ],
} as FeeInfo;

describe('bitcoinSwapUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe(getBitcoinSwapFromAddress.name, () => {
        const getParams = () => ({
            account: btc1NormalAccount,
            btcSwapComposeTemplate,
            feeInfo,
            sendCryptoAmount: '0.1',
            shouldSendInSats: false,
        });

        it('should join the derived input addresses at the normal fee level', async () => {
            mockDeriveBitcoinSwapFromAddresses.mockResolvedValue({
                addresses: ['address-1', 'address-2'],
                amount: '10000000',
            });

            await expect(getBitcoinSwapFromAddress(getParams())).resolves.toBe(
                'address-1;address-2',
            );
            expect(mockDeriveBitcoinSwapFromAddresses).toHaveBeenCalledWith(
                expect.objectContaining({
                    account: btc1NormalAccount,
                    sendStringAmount: '0.1',
                    decimals: 8,
                    feePerUnit: '5',
                    shouldSendInSats: false,
                    btcSwapComposeTemplate,
                }),
            );
        });

        it('should return undefined when no input addresses can be derived', async () => {
            mockDeriveBitcoinSwapFromAddresses.mockResolvedValue(undefined);

            await expect(getBitcoinSwapFromAddress(getParams())).resolves.toBeUndefined();
        });

        it('should not derive input addresses for a non-bitcoin account', async () => {
            await expect(
                getBitcoinSwapFromAddress({ ...getParams(), account: eth1NormalAccount }),
            ).resolves.toBeUndefined();
            expect(mockDeriveBitcoinSwapFromAddresses).not.toHaveBeenCalled();
        });
    });

    describe(getBitcoinSwapMaxAmount.name, () => {
        it('should return the derived send-max amount in network units', async () => {
            mockDeriveBitcoinSwapFromAddresses.mockResolvedValue({
                addresses: ['address-1'],
                amount: '12345678',
            });

            await expect(
                getBitcoinSwapMaxAmount({
                    account: btc1NormalAccount,
                    btcSwapComposeTemplate,
                    feeInfo,
                }),
            ).resolves.toBe('0.12345678');
            expect(mockDeriveBitcoinSwapFromAddresses).toHaveBeenCalledWith(
                expect.objectContaining({
                    sendStringAmount: '',
                    setMaxOutputId: 0,
                    feePerUnit: '5',
                    btcSwapComposeTemplate,
                }),
            );
        });

        it('should return undefined when the send-max amount cannot be derived', async () => {
            mockDeriveBitcoinSwapFromAddresses.mockResolvedValue(undefined);

            await expect(
                getBitcoinSwapMaxAmount({
                    account: btc1NormalAccount,
                    btcSwapComposeTemplate,
                    feeInfo: null,
                }),
            ).resolves.toBeUndefined();
            expect(mockDeriveBitcoinSwapFromAddresses).toHaveBeenCalledWith(
                expect.objectContaining({ feePerUnit: undefined }),
            );
        });

        it('should not derive the max amount for a non-bitcoin account', async () => {
            await expect(
                getBitcoinSwapMaxAmount({
                    account: eth1NormalAccount,
                    btcSwapComposeTemplate,
                    feeInfo,
                }),
            ).resolves.toBeUndefined();
            expect(mockDeriveBitcoinSwapFromAddresses).not.toHaveBeenCalled();
        });
    });
});
