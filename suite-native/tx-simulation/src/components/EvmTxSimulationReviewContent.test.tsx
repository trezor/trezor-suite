import { type TxSimulationAction } from '@suite-common/wallet-types';
import { Button } from '@suite-native/atoms';
import { Translation, getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';

import { EvmTxSimulationReviewContent } from './EvmTxSimulationReviewContent';

const action: TxSimulationAction = {
    method: 'ethereumSignTransaction',
    payload: {
        path: "m/44'/60'/0'/0/0",
        transaction: {
            chainId: 146,
            to: '0x0000000000000000000000000000000000000001',
            value: '0x0',
            nonce: '0x0',
            gasLimit: '0x5208',
            gasPrice: '0x1',
        },
    },
    fromAddress: '0x0000000000000000000000000000000000000002',
    sourceOrigin: 'ambire://trezor',
};

describe('EvmTxSimulationReviewContent', () => {
    it('allows continuing or cancelling on an unsupported chain', async () => {
        const onConfirm = jest.fn();
        const onCancel = jest.fn();
        const { getByText, getByTestId } = await renderWithBasicProvider(
            <EvmTxSimulationReviewContent
                action={action}
                onConfirm={onConfirm}
                confirmTestID="confirm-simulation"
                cancelButton={
                    <Button onPress={onCancel} testID="cancel-simulation">
                        <Translation id="generic.buttons.cancel" />
                    </Button>
                }
            />,
        );

        expect(
            getByText(getTranslation('moduleConnectPopup.simulation.simulationStatusError')),
        ).toBeOnTheScreen();
        expect(getByTestId('confirm-simulation')).toBeEnabled();
        expect(getByTestId('cancel-simulation')).toBeEnabled();

        await userEvent.press(getByTestId('confirm-simulation'));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        await userEvent.press(getByTestId('cancel-simulation'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('respects the caller disabling confirmation on an unsupported chain', async () => {
        const onConfirm = jest.fn();
        const { getByTestId } = await renderWithBasicProvider(
            <EvmTxSimulationReviewContent
                action={action}
                onConfirm={onConfirm}
                confirmTestID="confirm-simulation"
                isConfirmDisabled
            />,
        );

        expect(getByTestId('confirm-simulation')).toBeDisabled();
        await userEvent.press(getByTestId('confirm-simulation'));
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
