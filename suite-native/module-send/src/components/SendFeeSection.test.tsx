import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, type FeesStatus } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { SendFeeSection } from './SendFeeSection';

const mockFeeSelector = jest.fn((_props: unknown) => null);
const mockUpdateFeeInfoThunk = jest.fn((payload: unknown) => ({
    type: 'fees/updateFeeInfoThunkMock',
    payload,
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFeeInfoThunk: (payload: unknown) => mockUpdateFeeInfoThunk(payload),
}));

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: (props: unknown) => mockFeeSelector(props),
}));

const btcSymbol = asNetworkSymbol('btc');
const account = mockWalletAccount({ symbol: btcSymbol });

const networkFeeInfo: FeeInfo = {
    blockHeight: 0,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '1', blocks: 1 }],
};

type RenderSendFeeSectionParams = {
    feeInfo?: FeeInfo;
    feeStatus: FeesStatus;
    isFormValid?: boolean;
};

const renderSendFeeSection = async ({
    feeInfo,
    feeStatus,
    isFormValid = true,
}: RenderSendFeeSectionParams) =>
    await renderWithStoreProvider(
        <SendFeeSection accountKey={account.key} isFormValid={isFormValid} />,
        {
            preloadedState: {
                wallet: {
                    accounts: [account],
                    fees: {
                        [btcSymbol]: {
                            status: feeStatus,
                            data: feeInfo,
                        },
                    },
                    send: { drafts: {} },
                },
            },
        },
    );

describe('SendFeeSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders nothing when the send form is invalid', async () => {
        const { toJSON } = await renderSendFeeSection({
            feeStatus: 'error',
            isFormValid: false,
        });

        expect(toJSON()).toBeNull();
        expect(mockFeeSelector).not.toHaveBeenCalled();
    });

    it('renders unavailable fees with Retry and refetches fees when pressed', async () => {
        const { getByText } = await renderSendFeeSection({ feeStatus: 'error' });

        expect(getByText(getTranslation('moduleSend.fees.unavailable'))).toBeOnTheScreen();

        await act(async () => {
            await fireEvent.press(getByText(getTranslation('generic.buttons.retry')));
        });

        expect(mockUpdateFeeInfoThunk).toHaveBeenCalledWith({ networkSymbol: btcSymbol });
        expect(mockFeeSelector).not.toHaveBeenCalled();
    });

    it('renders the fee selector when cached network fees remain available after an error', async () => {
        await renderSendFeeSection({ feeInfo: networkFeeInfo, feeStatus: 'error' });

        expect(mockFeeSelector).toHaveBeenCalledTimes(1);
    });
});
