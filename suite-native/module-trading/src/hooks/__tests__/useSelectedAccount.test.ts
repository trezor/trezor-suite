import { Account } from '@suite-common/wallet-types/';
import { BasicProviderForTests, act, renderHook } from '@suite-native/test-utils';

import { useSelectedAccount } from '../useSelectedAccount';

describe('useSelectedAccount', () => {
    const onCloseMock = jest.fn();
    const onAccountSelectMock = jest.fn();

    const renderUseSelectedAccountHook = (isVisible: boolean) =>
        renderHook(useSelectedAccount, {
            wrapper: BasicProviderForTests,
            initialProps: {
                isVisible,
                onClose: onCloseMock,
                onAccountSelect: onAccountSelectMock,
            },
        });

    const getBtcAccount = () =>
        ({
            symbol: 'btc',
            accountType: 'normal',
            accountLabel: 'BTC Account',
            addresses: {
                used: [
                    {
                        address: '1BTC',
                        path: 'm/84/0/0',
                        transfers: 0,
                        balance: '0',
                        sent: '0',
                        received: '0',
                    },
                ],
                change: [],
                unused: [],
            },
        }) as unknown as Account;

    const getEthAccount = () =>
        ({
            symbol: 'eth',
            accountType: 'normal',
            accountLabel: 'ETH Account',
            addresses: undefined,
        }) as unknown as Account;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('selectedAccount', () => {
        it('should be undefined by default', () => {
            const { result } = renderUseSelectedAccountHook(false);

            expect(result.current.selectedAccount).toBeUndefined();
        });

        it('should be set to undefined when isVisible changed to false', () => {
            const { result, rerender } = renderUseSelectedAccountHook(true);

            act(() => {
                result.current.onItemSelect({ account: getBtcAccount() });
            });

            rerender({
                isVisible: false,
                onAccountSelect: onAccountSelectMock,
                onClose: onCloseMock,
            });

            expect(result.current.selectedAccount).toBeUndefined();
        });
    });

    describe('onItemSelect', () => {
        it('should set selectedAccount for BTC like accounts', () => {
            const account = getBtcAccount();
            const { result } = renderUseSelectedAccountHook(false);

            act(() => {
                result.current.onItemSelect({ account });
            });

            expect(result.current.selectedAccount).toBe(account);
            expect(onAccountSelectMock).not.toHaveBeenCalled();
            expect(onCloseMock).not.toHaveBeenCalled();
        });

        it('should call onAccountSelect for ETH like accounts', () => {
            const account = getEthAccount();
            const { result } = renderUseSelectedAccountHook(false);

            act(() => {
                result.current.onItemSelect({ account });
            });

            expect(result.current.selectedAccount).toBeUndefined();
            expect(onAccountSelectMock).toHaveBeenCalledWith({ account });
            expect(onCloseMock).toHaveBeenCalledTimes(1);
        });

        it('should call onAccountSelect for BTC like accounts when selected address is specified', () => {
            const account = getBtcAccount();
            const selectedReceiveAccount = { account, address: account.addresses!.used[0] };
            const { result } = renderUseSelectedAccountHook(true);

            act(() => {
                result.current.onItemSelect(selectedReceiveAccount);
            });

            expect(result.current.selectedAccount).toBeUndefined();
            expect(onAccountSelectMock).toHaveBeenCalledWith(selectedReceiveAccount);
            expect(onCloseMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('clearSelectedAccount', () => {
        it('should clear selectedAccount', () => {
            const { result } = renderUseSelectedAccountHook(true);

            act(() => {
                result.current.onItemSelect({ account: getBtcAccount() });
                result.current.clearSelectedAccount();
            });

            expect(result.current.selectedAccount).toBeUndefined();
        });
    });
});
