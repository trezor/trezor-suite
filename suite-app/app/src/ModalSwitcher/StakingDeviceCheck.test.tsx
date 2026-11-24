import { Provider, useSelector } from 'react-redux';

import { type UnknownAction } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen } from '@testing-library/react';

import {
    MODAL_CONTEXT_NONE,
    type ModalRootState,
    beginStakingDeviceCheck,
    closeModal,
    endStakingDeviceCheck,
    modalReducer,
    openModal,
    selectModal,
} from '@suite/modal';
import { ReduxModal } from '@suite-app/app-modal';
import { type NetworksRootState } from '@suite-common/networks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { EarnFlow } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type BlockchainRootState, blockchainInitialState } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';
import { ServicesProvider } from '@trezor/dependency-injection';

jest.mock('@trezor/suite', () => ({
    useSelector: jest.requireActual<{ useSelector: typeof useSelector }>('react-redux').useSelector,
    StakeModal: () => <input aria-label="Stake amount" defaultValue="1" />,
    DeviceContextModal: () => <div>Device prompt</div>,
    ApplicationLogModal: () => <div>Application log</div>,
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const device = mockSuiteDevice();
const stake = openModal({ type: 'stake', account, flow: EarnFlow.Stake });

type StakingModalTestState = ModalRootState & BlockchainRootState & NetworksRootState;

const TrackedReduxModal = () => {
    const modal = useSelector(selectModal);

    return modal.context === MODAL_CONTEXT_NONE ? null : <ReduxModal {...modal} />;
};

const renderModal = () => {
    const preloadedState: StakingModalTestState = {
        modal: modalReducer(undefined, stake),
        networks: mockNetworksState([account.symbol]),
        wallet: { blockchain: blockchainInitialState },
    };
    const { services } = createTestCompositionRoot<void, StakingModalTestState>({
        preloadedState,
        reducer: (state = preloadedState, action) => ({
            ...state,
            modal: modalReducer(state.modal, action),
        }),
    });
    render(
        <Provider store={services.store}>
            <ServicesProvider services={services}>
                <TrackedReduxModal />
            </ServicesProvider>
        </Provider>,
    );

    return (action: UnknownAction) => act(() => services.store.dispatch(action));
};

describe('staking form during device verification', () => {
    it.each([UI_REQUESTS.REQUEST_PIN, UI_REQUESTS.REQUEST_PASSPHRASE])(
        'keeps the same draft under %s and restores it on Connect close',
        prompt => {
            const send = renderModal();
            const amount = screen.getByRole('textbox', { name: 'Stake amount' });
            fireEvent.change(amount, { target: { value: '2.75' } });
            const begin = beginStakingDeviceCheck();
            send(begin);
            send({ type: prompt, payload: { device } });
            expect(screen.getByText('Device prompt')).toBeTruthy();
            expect(screen.getByRole('textbox')).toBe(amount);
            send({ type: UI_EVENTS.CLOSE_UI_WINDOW });
            send(endStakingDeviceCheck({ id: begin.payload }));
            expect(screen.queryByText('Device prompt')).toBeNull();
            expect(screen.getByDisplayValue('2.75')).toBe(amount);
        },
    );

    it('preserves a form when an already-unlocked device sends only CLOSE_UI_WINDOW', () => {
        const send = renderModal();
        const input = screen.getByRole('textbox');
        const begin = beginStakingDeviceCheck();
        send(begin);
        send({ type: UI_EVENTS.CLOSE_UI_WINDOW });
        send(endStakingDeviceCheck({ id: begin.payload }));
        expect(screen.getByRole('textbox')).toBe(input);
    });

    it.each([openModal({ type: 'application-log' }), closeModal()])(
        'does not restore a dismissed or replaced form',
        replacement => {
            const send = renderModal();
            const begin = beginStakingDeviceCheck();
            send(begin);
            send({ type: UI_REQUESTS.REQUEST_PIN, payload: { device } });
            send(replacement);
            send(endStakingDeviceCheck({ id: begin.payload }));
            expect(screen.queryByRole('textbox')).toBeNull();
        },
    );
});
