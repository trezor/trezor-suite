import '@suite-common/test-utils/globalOverrides';

import { screen, within } from '@testing-library/react';

import { messages } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { EARN_YIELD_CLAIM_PROVIDER, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type EvmTransactionPurpose,
    type TransactionReviewOutput as TransactionReviewOutputType,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import {
    TransactionReviewOutput,
    type TransactionReviewOutputProps,
} from './TransactionReviewOutput';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const modelOneDevice = mockSuiteDevice(undefined, {
    major_version: 1,
    minor_version: 12,
    patch_version: 1,
});

const clearSigningDevice = mockSuiteDevice(undefined, {
    major_version: 2,
    minor_version: 12,
    patch_version: 4,
});

const RECIPIENT = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';
const CLAIM_DATA = `0x71ee95c0${'00'.repeat(32 * 4)}`;

const ethereumAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    accountType: 'normal',
});
const cardanoAccount = mockWalletAccount({ symbol: asNetworkSymbol('ada'), accountType: 'normal' });

type RenderOutputParams = {
    device: TrezorDevice;
    output: TransactionReviewOutputType;
    state: TransactionReviewOutputProps['state'];
    account?: TransactionReviewOutputProps['account'];
    evmTxType?: EvmTransactionPurpose;
};

const renderOutput = ({
    device,
    output,
    state,
    account = ethereumAccount,
    evmTxType,
}: RenderOutputParams) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            device: { ...mockInitialAppState.device, selectedDevice: device },
        },
    });

    renderWithProviders(
        services,
        <TransactionReviewOutput
            {...output}
            state={state}
            account={account}
            isRbf={false}
            evmTxType={evmTxType}
        />,
    );
};

const outputValueText = (id: string) =>
    within(screen.getByTestId(`@modal/output-${id}`))
        .getByTestId('@modal/output-value')
        .textContent?.replace(/\s/g, '');

const addressConfirmationNote = () =>
    screen.queryByText(messages.TR_SEND_ADDRESS_CONFIRMATION_NOTE.defaultMessage);

describe('TransactionReviewOutput', () => {
    describe('legacy recipient address', () => {
        it('shows the address instead of the confirmation note on Model One', () => {
            renderOutput({
                device: modelOneDevice,
                output: { type: 'regular_legacy', value: RECIPIENT },
                state: 'active',
            });

            expect(
                screen.getByText(messages.TR_RECIPIENT_ADDRESS.defaultMessage),
            ).toBeInTheDocument();
            expect(addressConfirmationNote()).not.toBeInTheDocument();
            expect(outputValueText('regular_legacy')).toBe(RECIPIENT);
        });

        it('keeps the confirmation note for the legacy row on firmware with the updated send flow', () => {
            renderOutput({
                device: clearSigningDevice,
                account: cardanoAccount,
                output: { type: 'regular_legacy', value: 'addr1qxy' },
                state: 'active',
            });

            expect(addressConfirmationNote()).toBeInTheDocument();
        });

        it('keeps the confirmation note for an unconfirmed address on firmware with the updated send flow', () => {
            renderOutput({
                device: clearSigningDevice,
                output: { type: 'address', value: RECIPIENT },
                state: 'active',
            });

            expect(addressConfirmationNote()).toBeInTheDocument();
        });
    });

    describe('rewards claim', () => {
        it('titles the legacy address row as the claim source and shows the address on Model One', () => {
            renderOutput({
                device: modelOneDevice,
                output: { type: 'regular_legacy', value: RECIPIENT },
                state: 'active',
                evmTxType: 'claim',
            });

            expect(
                screen.getByText(messages.TR_EARN_YIELD_REVIEW_CLAIM_TITLE.defaultMessage),
            ).toBeInTheDocument();
            expect(addressConfirmationNote()).not.toBeInTheDocument();
            expect(outputValueText('regular_legacy')).toBe(RECIPIENT);
        });

        it('titles the raw calldata row as data on Model One', () => {
            renderOutput({
                device: modelOneDevice,
                output: { type: 'data', value: CLAIM_DATA },
                state: 'unconfirmed',
                evmTxType: 'claim',
            });

            expect(screen.getByText(messages.DATA.defaultMessage)).toBeInTheDocument();
            expect(
                screen.queryByText(messages.TR_EARN_YIELD_REVIEW_CLAIM_TITLE.defaultMessage),
            ).not.toBeInTheDocument();
            expect(outputValueText('data')).toBe(CLAIM_DATA);
        });

        it('titles the provider row as the claim source on clear-signing firmware', () => {
            renderOutput({
                device: clearSigningDevice,
                output: { type: 'data', value: EARN_YIELD_CLAIM_PROVIDER },
                state: 'active',
                evmTxType: 'claim',
            });

            expect(
                screen.getByText(messages.TR_EARN_YIELD_REVIEW_CLAIM_TITLE.defaultMessage),
            ).toBeInTheDocument();
            expect(outputValueText('data')).toBe(EARN_YIELD_CLAIM_PROVIDER);
        });
    });
});
