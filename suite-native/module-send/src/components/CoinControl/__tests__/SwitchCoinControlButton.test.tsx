import { type AccountKey } from '@suite-common/wallet-types';
import {
    BasicProviderForTests,
    renderHook,
    renderWithBasicProvider,
} from '@suite-native/test-utils';
import { type NativeStyleUtils, useNativeStyles } from '@trezor/styles';
import { BigNumber } from '@trezor/utils';

import { useUtxoSelection } from '../../../hooks/useUtxoSelection';
import { SwitchCoinControlButton } from '../SwitchCoinControlButton';

jest.mock('../../../hooks/useUtxoSelection', () => ({
    useUtxoSelection: jest.fn(),
}));

const accountKey = 'account-key' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('renders button with correct color scheme', () => {
    let colors: NativeStyleUtils['colors'];

    beforeAll(() => {
        const { result } = renderHook(() => useNativeStyles(), { wrapper: BasicProviderForTests });
        ({ colors } = result.current.utils);
    });

    it('should render button with yellowBold color scheme when selected utxos are not enough', () => {
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

        const { getByTestId } = renderWithBasicProvider(
            <SwitchCoinControlButton accountKey={accountKey} amount="1000" />,
        );

        const button = getByTestId('switch-coin-control-button');
        expect(button.props.style[1].backgroundColor).toBe(colors.backgroundAlertYellowBold);
    });

    it('should render button with primary color scheme when utxos are selected and amount is sufficient', () => {
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
        const { getByTestId } = renderWithBasicProvider(
            <SwitchCoinControlButton accountKey={accountKey} amount="1000" />,
        );

        const button = getByTestId('switch-coin-control-button');
        expect(button.props.style[1].backgroundColor).toBe(colors.backgroundPrimaryDefault);
    });

    it('should render a button with gray color scheme when no utxos are selected and no amount is provided', () => {
        (useUtxoSelection as jest.Mock).mockReturnValue({
            isCoinControlEnabled: false,
            selectedUtxos: [],
            totalSelectedAmount: BigNumber(1000),
        });

        const { getByTestId } = renderWithBasicProvider(
            <SwitchCoinControlButton accountKey={accountKey} />,
        );

        const button = getByTestId('switch-coin-control-button');
        expect(button.props.style[1].backgroundColor).toBe(
            colors.backgroundTertiaryDefaultOnElevation0,
        );
    });
});
