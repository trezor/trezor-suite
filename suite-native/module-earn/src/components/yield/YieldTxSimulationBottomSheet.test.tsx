import { type ComponentProps } from 'react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type BottomSheetModal } from '@suite-native/atoms';
import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { type EvmTxSimulationReviewContent } from '@suite-native/tx-simulation';

import { YieldTxSimulationBottomSheet } from './YieldTxSimulationBottomSheet';

const mockBottomSheetModal = jest.fn(
    (props: ComponentProps<typeof BottomSheetModal>) => props.children,
);

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    BottomSheetModal: (props: ComponentProps<typeof BottomSheetModal>) =>
        mockBottomSheetModal(props),
}));
jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    composeStablecoinYieldTxSimulationAction: () => ({ action: {} }),
}));
jest.mock('@suite-native/tx-simulation', () => ({
    EvmTxSimulationReviewContent: ({
        cancelButton,
        onConfirm,
    }: ComponentProps<typeof EvmTxSimulationReviewContent>) => {
        const { Pressable } = jest.requireActual('react-native');

        return (
            <>
                {cancelButton}
                <Pressable testID="confirm-simulation" onPress={onConfirm} />
            </>
        );
    },
}));

const getSheetProps = () => {
    const props = mockBottomSheetModal.mock.lastCall?.[0];
    if (!props) throw new Error('Simulation sheet has not rendered');

    return props;
};

const renderSheet = async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const view = await renderWithBasicProvider(
        <YieldTxSimulationBottomSheet
            account={mockWalletAccount({ symbol: asNetworkSymbol('eth') })}
            flow="wrap"
            unsignedTx="prepared-transaction"
            ref={{ current: null }}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />,
    );

    return {
        ...view,
        onCancel,
        onConfirm,
        dismiss: async () => {
            await act(() => getSheetProps().onDismiss?.());
        },
    };
};

describe('YieldTxSimulationBottomSheet decisions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reports cancellation when the sheet is dismissed through its backdrop or a gesture', async () => {
        const view = await renderSheet();

        await view.dismiss();

        expect(view.onCancel).toHaveBeenCalledTimes(1);
        expect(view.onConfirm).not.toHaveBeenCalled();
    });

    it('reports only one cancellation when the close button also dismisses the sheet', async () => {
        const view = await renderSheet();

        await act(() => getSheetProps().onClose?.());
        await view.dismiss();

        expect(view.onCancel).toHaveBeenCalledTimes(1);
    });

    it('reports only one cancellation when Cancel also dismisses the sheet', async () => {
        const view = await renderSheet();

        await fireEvent.press(view.getByText('Cancel'));
        await view.dismiss();

        expect(view.onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not report cancellation when Continue dismisses the sheet', async () => {
        const view = await renderSheet();

        await fireEvent.press(view.getByTestId('confirm-simulation'));
        await view.dismiss();

        expect(view.onConfirm).toHaveBeenCalledTimes(1);
        expect(view.onCancel).not.toHaveBeenCalled();
    });

    it('handles a cancellation after the same sheet is presented again', async () => {
        const view = await renderSheet();

        await fireEvent.press(view.getByTestId('confirm-simulation'));
        await view.dismiss();
        await fireEvent.press(view.getByText('Cancel'));
        await view.dismiss();

        expect(view.onConfirm).toHaveBeenCalledTimes(1);
        expect(view.onCancel).toHaveBeenCalledTimes(1);
    });
});
