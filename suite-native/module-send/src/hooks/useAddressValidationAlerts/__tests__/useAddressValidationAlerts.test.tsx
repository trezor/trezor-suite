import { useRoute } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    waitFor,
} from '@suite-native/test-utils';
import TrezorConnect from '@trezor/connect';

import { useAddressValidationAlerts } from '../useAddressValidationAlerts';

const mockAccountInfoResponses = {
    unusedAddress: {
        success: true,
        payload: {
            history: { total: 0 },
            misc: undefined,
        },
    },
    usedAddress: {
        success: true,
        payload: {
            history: { total: 5 },
            misc: undefined,
        },
    },
    contractAddress: {
        success: true,
        payload: {
            history: { total: 0 },
            misc: {
                contractInfo: {
                    type: 'contract',
                },
            },
        },
    },
    networkError: {
        success: false,
        error: { message: 'Network error', code: 'Backend_Disconnected' },
    },
} as const;

const contractAddressLowercase = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const contractAddressChecksum = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const eoaAddressChecksum = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const eoaAddressChecksumInvalid = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aa96045';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: jest.fn(),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: jest.fn(),
}));

const mockedUseRoute = useRoute as jest.MockedFunction<any>;
const mockedUseAlert = useAlert as jest.MockedFunction<any>;

let getAccountInfoSpy: jest.SpyInstance;

describe('useAddressValidationAlerts', () => {
    let mockShowAlert: jest.Mock;
    let mockSetValue: jest.Mock;
    let mockWatch: jest.Mock;

    const mockRoute = {
        params: {
            tokenContract: undefined,
            accountKey: 'test-account-key',
        },
    };

    const defaultPreloadedState: PreloadedState = {
        wallet: {
            accounts: [
                {
                    key: 'test-account-key',
                    symbol: 'eth',
                    networkType: 'ethereum',
                },
            ],
        },
    };

    const renderHookWithForm = async (
        preloadedState: PreloadedState = defaultPreloadedState,
        { inputIndex = 0 } = {},
    ) => {
        const result = await renderHookWithStoreProviderAsync(
            () => useAddressValidationAlerts({ inputIndex }),
            {
                preloadedState,
                wrapper: ({ children }) => (
                    <Form form={{ setValue: mockSetValue, watch: mockWatch } as any}>
                        {children}
                    </Form>
                ),
            },
        );

        // allow async TrezorConnect.getAccountInfo to resolve
        await act(async () => {
            await Promise.resolve();
        });

        return result;
    };

    beforeEach(() => {
        mockShowAlert = jest.fn();
        mockSetValue = jest.fn();
        mockWatch = jest.fn();

        mockedUseRoute.mockReturnValue(mockRoute);
        mockedUseAlert.mockReturnValue({ showAlert: mockShowAlert });

        getAccountInfoSpy = jest.spyOn(TrezorConnect, 'getAccountInfo');
        getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.unusedAddress as any);
    });

    describe('Basic functionality', () => {
        it('should return wasAddressChecksummed state', async () => {
            mockWatch.mockReturnValue('');

            const { result } = await renderHookWithForm();

            expect(result.current).toEqual({
                wasAddressChecksummed: false,
            });
        });

        it('should handle empty address', async () => {
            mockWatch.mockReturnValue('');

            await renderHookWithForm();

            expect(mockShowAlert).not.toHaveBeenCalled();
            expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
        });
    });

    describe('Address checksum validation', () => {
        beforeEach(() => {
            mockWatch.mockReturnValue('');
        });

        it('should show checksum alert for unused address that needs checksumming', async () => {
            mockWatch.mockReturnValue(eoaAddressChecksum.toLocaleLowerCase());
            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.unusedAddress as any);

            await renderHookWithForm();

            expect(mockShowAlert).toHaveBeenCalledWith({
                title: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.title',
                    }),
                }),
                description: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.body',
                    }),
                }),
                primaryButtonTitle: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.primaryButton',
                    }),
                }),
                onPressPrimaryButton: expect.any(Function),
            });
        });

        it('should auto-convert checksum for used addresses without showing alert', async () => {
            mockWatch.mockReturnValue(contractAddressLowercase);
            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.usedAddress as any);

            const { result } = await renderHookWithForm();

            expect(mockSetValue).toHaveBeenCalledWith(
                'outputs.0.address',
                contractAddressChecksum,
                { shouldValidate: true },
            );
            await waitFor(() => expect(result.current.wasAddressChecksummed).toBe(true));
            expect(mockShowAlert).not.toHaveBeenCalled();
        });

        it('should convert address to checksum when user confirms alert', async () => {
            mockWatch.mockReturnValue(contractAddressLowercase);
            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.unusedAddress as any);

            const { result } = await renderHookWithForm();

            // Simulate user clicking the primary button
            const alertCall = mockShowAlert.mock.calls[0][0];
            act(() => {
                alertCall.onPressPrimaryButton();
            });

            expect(mockSetValue).toHaveBeenCalledWith(
                'outputs.0.address',
                contractAddressChecksum,
                { shouldValidate: true },
            );
            await waitFor(() => expect(result.current.wasAddressChecksummed).toBe(true));
        });

        it('should not show checksum alert for valid checksum addresses', async () => {
            mockWatch.mockReturnValue(contractAddressChecksum);
            await renderHookWithForm();

            expect(mockShowAlert).not.toHaveBeenCalled();
            expect(mockSetValue).not.toHaveBeenCalled();
        });

        it('should not show checksum alert for non-Ethereum networks', async () => {
            const btcPreloadedState: PreloadedState = {
                wallet: {
                    accounts: [
                        {
                            key: 'test-account-key',
                            symbol: 'btc',
                            networkType: 'bitcoin',
                        },
                    ],
                },
            };

            mockWatch.mockReturnValue('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');

            await renderHookWithForm(btcPreloadedState);

            expect(mockShowAlert).not.toHaveBeenCalled();
            expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
        });

        it('should not auto-convert checksum for invalid mixed case address', async () => {
            mockWatch.mockReturnValue(eoaAddressChecksumInvalid);

            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.unusedAddress as any);

            const { result } = await renderHookWithForm();

            expect(result.current.wasAddressChecksummed).toBe(false);
            expect(mockShowAlert).not.toHaveBeenCalled();
        });
    });

    describe('Contract address detection', () => {
        beforeEach(() => {
            mockWatch.mockReturnValue('');
        });

        it('should show contract address alert for contract addresses', async () => {
            mockWatch.mockReturnValue(contractAddressChecksum);
            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.contractAddress as any);

            await renderHookWithForm();

            expect(mockShowAlert).toHaveBeenCalledWith({
                title: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.smartContract.alert.title',
                    }),
                }),
                description: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.smartContract.alert.description',
                    }),
                }),
                primaryButtonTitle: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.smartContract.alert.primaryButton',
                    }),
                }),
                onPressPrimaryButton: expect.any(Function),
            });
        });

        it('should not show contract alert twice for the same address', async () => {
            mockWatch.mockReturnValue(contractAddressLowercase);
            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.contractAddress as any);

            const { rerender } = await renderHookWithForm();
            expect(mockShowAlert).toHaveBeenCalled();

            const alertCall = mockShowAlert.mock.calls[0][0];
            await act(() => {
                alertCall.onPressPrimaryButton();
            });

            mockShowAlert.mockClear();

            rerender({});

            expect(mockShowAlert).not.toHaveBeenCalled();
        });

        it('should not show contract alert for regular addresses', async () => {
            mockWatch.mockReturnValue(eoaAddressChecksum);
            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.unusedAddress as any);

            await renderHookWithForm();

            expect(mockShowAlert).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Contract Address Detected',
                }),
            );
        });

        it('should not check contract address for non-Ethereum networks', async () => {
            const btcPreloadedState: PreloadedState = {
                wallet: {
                    accounts: [
                        {
                            key: 'test-account-key',
                            symbol: 'btc',
                            networkType: 'bitcoin',
                        },
                    ],
                },
            };

            mockWatch.mockReturnValue('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');

            await renderHookWithForm(btcPreloadedState);

            expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
        });
    });

    describe('Token validation alerts', () => {
        const tokenContract = '0x0000000000085d4780B73119b644AE5ecd22b376';

        beforeEach(() => {
            mockWatch.mockReturnValue('eoaAddressChecksum');

            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.unusedAddress as any);

            mockedUseRoute.mockReturnValue({
                params: {
                    tokenContract,
                    accountKey: 'test-account-key',
                },
            });
        });

        it('should show token alert when token contract is present', async () => {
            mockWatch.mockReturnValue(contractAddressChecksum);
            await renderHookWithForm();

            expect(mockShowAlert).toHaveBeenCalledWith({
                appendix: expect.objectContaining({
                    props: expect.objectContaining({
                        accountKey: 'test-account-key',
                        tokenContract: '0x0000000000085d4780B73119b644AE5ecd22b376',
                    }),
                }),
                primaryButtonTitle: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'generic.buttons.gotIt',
                    }),
                }),
                onPressPrimaryButton: expect.any(Function),
            });
        });

        it('should not show token alert when no token contract', async () => {
            mockedUseRoute.mockReturnValue({
                params: {
                    tokenContract: undefined,
                    accountKey: 'test-account-key',
                },
            });

            await renderHookWithForm();

            expect(mockShowAlert).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    appendix: 'TokenOfNetworkAlertBody',
                }),
            );
        });

        it('should show checksum alert after token alert is acknowledged', async () => {
            mockWatch.mockReturnValue(contractAddressLowercase);
            await renderHookWithForm();

            const tokenAlertCall = mockShowAlert.mock.calls[0][0];
            mockShowAlert.mockClear();

            await act(() => {
                tokenAlertCall.onPressPrimaryButton();
            });

            expect(mockShowAlert).toHaveBeenCalledWith({
                title: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.title',
                    }),
                }),
                description: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.body',
                    }),
                }),
                primaryButtonTitle: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.primaryButton',
                    }),
                }),
                onPressPrimaryButton: expect.any(Function),
            });
        });
    });

    describe('Error handling', () => {
        it('should handle TrezorConnect.getAccountInfo error gracefully', async () => {
            mockWatch.mockReturnValue(contractAddressLowercase);

            getAccountInfoSpy.mockResolvedValue(mockAccountInfoResponses.networkError);

            await renderHookWithForm();

            expect(mockShowAlert).toHaveBeenCalledWith({
                title: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.title',
                    }),
                }),
                description: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.body',
                    }),
                }),
                primaryButtonTitle: expect.objectContaining({
                    props: expect.objectContaining({
                        id: 'moduleSend.outputs.recipients.checksum.alert.primaryButton',
                    }),
                }),
                onPressPrimaryButton: expect.any(Function),
            });
        });

        it('should handle missing route params gracefully', async () => {
            mockedUseRoute.mockReturnValue({
                params: {},
            });

            mockWatch.mockReturnValue(eoaAddressChecksum);

            await renderHookWithForm();

            expect(mockShowAlert).not.toHaveBeenCalled();
        });
    });
});
