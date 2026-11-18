import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Button } from '@suite-native/atoms';
import {
    BasicProviderForTests,
    renderHook,
    renderWithBasicProvider,
} from '@suite-native/test-utils';
import { useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

import { SwitchCoinControlButton } from './SwitchCoinControlButton';
import { useUtxoSelection } from '../../hooks/useUtxoSelection';

jest.mock('@suite-native/atoms', () => ({
    Button: jest.fn(() => null),
}));

jest.mock('../../hooks/useUtxoSelection', () => ({
    useUtxoSelection: jest.fn(),
}));

const accountKey = mockAccountKey({ descriptor: 'accountKey' });

describe('renders button with correct color scheme', () => {
    beforeAll(async () => {
        await renderHook(() => useNativeStyles(), {
            wrapper: BasicProviderForTests,
        });
    });

    it('should render warning primary button when selected utxos are not enough', async () => {
        (useUtxoSelection as jest.Mock).mockReturnValue({
            isCoinControlEnabled: true,
            selectedUtxos: [
                {
                    txid: 'txid1',
                    vout: 0,
                    amount: '500',
                    blockHeight: 123456,
                    address: 'address1',
                    path: 'm/44/0/0/0',
                    confirmations: 10,
                },
            ],
            totalSelectedAmount: BigNumber(500),
        });

        await renderWithBasicProvider(
            <SwitchCoinControlButton accountKey={accountKey} amount="1000" />,
        );

        expect(Button).toHaveBeenCalledWith(
            expect.objectContaining({ intent: 'warning', priority: 'primary' }),
            undefined,
        );
    });

    it('should render brand primary button when utxos are selected and amount is sufficient', async () => {
        (useUtxoSelection as jest.Mock).mockReturnValue({
            isCoinControlEnabled: true,
            selectedUtxos: [
                {
                    txid: 'txid1',
                    vout: 0,
                    amount: '1000',
                    blockHeight: 123456,
                    address: 'address1',
                    path: 'm/44/0/0/0',
                    confirmations: 10,
                },
            ],
            totalSelectedAmount: BigNumber(1000),
        });

        await renderWithBasicProvider(
            <SwitchCoinControlButton accountKey={accountKey} amount="1000" />,
        );

        expect(Button).toHaveBeenCalledWith(
            expect.objectContaining({ intent: 'brand', priority: 'primary' }),
            undefined,
        );
    });

    it('should render neutral secondary button when no utxos are selected and no amount is provided', async () => {
        (useUtxoSelection as jest.Mock).mockReturnValue({
            isCoinControlEnabled: false,
            selectedUtxos: [],
            totalSelectedAmount: BigNumber(1000),
        });

        await renderWithBasicProvider(<SwitchCoinControlButton accountKey={accountKey} />);

        expect(Button).toHaveBeenCalledWith(
            expect.objectContaining({ intent: 'neutral', priority: 'secondary' }),
            undefined,
        );
    });
});
