import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useEarnPendingTransactionSheet } from './useEarnPendingTransactionSheet';

const mockOpen = jest.fn();
const mockClose = jest.fn();
const mockRef = { current: null };

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: mockRef,
        openModal: mockOpen,
        closeModal: mockClose,
    }),
}));
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useTransactionDetails: () => ({ explorerUrl: undefined, openInBlockchain: jest.fn() }),
}));

it('closes a presented pending sheet when the flow becomes inactive', async () => {
    const { rerender } = await renderHookWithBasicProvider(
        ({ isPending }) =>
            useEarnPendingTransactionSheet({
                accountKey: mockAccountKey(),
                pendingTxid: 'qa-transaction',
                isPending,
            }),
        { initialProps: { isPending: true } },
    );
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockClose).not.toHaveBeenCalled();

    await rerender({ isPending: false });
    expect(mockClose).toHaveBeenCalledTimes(1);

    await rerender({ isPending: true });
    expect(mockOpen).toHaveBeenCalledTimes(2);
});
