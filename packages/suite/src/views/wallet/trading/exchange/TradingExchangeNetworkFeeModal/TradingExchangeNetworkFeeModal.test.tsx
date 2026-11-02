import { type PropsWithChildren } from 'react';

import { render } from '@testing-library/react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { type FeeInfo, type FormState } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';

import { type useCompose } from 'src/hooks/wallet/form/useCompose';

import {
    TradingExchangeNetworkFeeModal,
    type TradingExchangeNetworkFeeModalProps,
} from './TradingExchangeNetworkFeeModal';

const mockComposeRequest = mock<ReturnType<typeof useCompose>['composeRequest']>();

jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('@trezor/components', () => {
    const Container = ({ children }: PropsWithChildren) => children;

    return {
        Column: Container,
        Banner: () => null,
        Modal: Object.assign(Container, { Button: () => null }),
    };
});
jest.mock('src/hooks/wallet/form/useCompose', () => ({
    useCompose: () => ({
        composedLevels: undefined,
        composeRequest: mockComposeRequest,
        onFeeLevelChange: jest.fn(),
        isLoading: false,
    }),
}));
jest.mock('src/hooks/wallet/form/useFees', () => ({
    useFees: () => ({ changeFeeLevel: jest.fn() }),
}));
jest.mock('src/components/wallet/Fees/CollapsibleFees/FeeLevels/FeeLevels', () => ({
    FeeLevels: () => null,
}));
jest.mock('./TradingExchangeNetworkFeeModalTotal', () => ({
    TradingExchangeNetworkFeeModalTotal: () => null,
}));

const feeInfo: FeeInfo = {
    blockHeight: 890366,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    dustLimit: 546,
    levels: [
        { label: 'low', feePerUnit: '0.59', blocks: 6 },
        { label: 'normal', feePerUnit: '1.16', blocks: 2 },
        { label: 'high', feePerUnit: '2', blocks: 1 },
    ],
};
const composeFormState: FormState = {
    ...DEFAULT_VALUES,
    outputs: [],
    options: ['broadcast'],
    selectedUtxos: [],
    selectedFee: 'normal',
};
const props: TradingExchangeNetworkFeeModalProps = {
    account: mockWalletAccount({ symbol: asNetworkSymbol('btc') }),
    feeInfo,
    composeFormState,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
};

describe('TradingExchangeNetworkFeeModal', () => {
    beforeEach(() => {
        mockComposeRequest.mockClear();
    });

    it('composes the fee levels when opened', () => {
        render(<TradingExchangeNetworkFeeModal {...props} />);

        expect(mockComposeRequest).toHaveBeenCalledTimes(1);
        expect(mockComposeRequest).toHaveBeenCalledWith('selectedFee');
    });

    it('recomposes when the fee levels change within the same block', () => {
        const { rerender } = render(<TradingExchangeNetworkFeeModal {...props} />);
        const refetchedFeeInfo: FeeInfo = {
            ...feeInfo,
            levels: [
                { label: 'low', feePerUnit: '0.27', blocks: 6 },
                { label: 'normal', feePerUnit: '0.55', blocks: 2 },
                { label: 'high', feePerUnit: '2', blocks: 1 },
            ],
        };

        rerender(<TradingExchangeNetworkFeeModal {...props} feeInfo={refetchedFeeInfo} />);

        expect(mockComposeRequest).toHaveBeenCalledTimes(2);
    });

    it('does not recompose when re-rendered with the same fee info', () => {
        const { rerender } = render(<TradingExchangeNetworkFeeModal {...props} />);

        rerender(<TradingExchangeNetworkFeeModal {...props} />);

        expect(mockComposeRequest).toHaveBeenCalledTimes(1);
    });
});
