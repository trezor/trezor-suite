import '@suite-common/test-utils/globalOverrides';

import { type UnknownAction } from '@reduxjs/toolkit';
import { fireEvent, screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_DREP, stakeInitialState } from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type SelectedAccountLoaded,
} from '@suite-common/wallet-types';

import { stakeReducer } from 'src/reducers/wallet';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { StakeChangeDelegateModalLoaded } from './StakeChangeDelegateModal';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

jest.mock('src/hooks/wallet/useChangeDelegateForm', () => {
    const { useForm } = jest.requireActual('react-hook-form');

    return {
        ...jest.requireActual('src/hooks/wallet/useChangeDelegateForm'),
        useChangeDelegateForm: () => {
            const methods = useForm();

            return {
                methods,
                handleSubmit: methods.handleSubmit,
                signTx: jest.fn(),
                changeFeeLevel: jest.fn(),
            };
        },
    };
});

jest.mock('src/components/wallet/Fees/Fees', () => ({ Fees: () => null }));

jest.mock('src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({ isVotingDisabled: false }),
}));

const DREP_CIP105_KEY_HASH = 'drep1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknjmv589e';
const DREP_VKH_KEY_HASH = 'drep_vkh1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknjat06vr';
const DREP_CIP129_KEY_HASH = 'drep1yfpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsqdglp';
const ACCOUNT_KEY = 'ada-account-key' as AccountKey;

const cardanoAccount = {
    key: ACCOUNT_KEY,
    index: 0,
    symbol: asNetworkSymbol('ada'),
    networkType: 'cardano',
    misc: { staking: { isActive: true, drep: { drep_id: DREP_CIP105_KEY_HASH } } },
} as unknown as Account;

const selectedAccount = {
    status: 'loaded',
    account: cardanoAccount,
} as unknown as SelectedAccountLoaded;

const renderModal = () => {
    const preloadedState = {
        ...mockInitialAppState,
        wallet: {
            ...mockInitialAppState.wallet,
            stake: {
                ...stakeInitialState,
                votingDelegation: {
                    accountKey: ACCOUNT_KEY,
                    option: { type: 'another_drep', drepId: '' },
                },
            },
        },
    };

    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState,
        reducer: (state = preloadedState, action: UnknownAction) => ({
            ...state,
            wallet: { ...state.wallet, stake: stakeReducer(state.wallet.stake, action) },
        }),
        serializableCheck: { ignoredActions: [] },
    });

    renderWithProviders(root, <StakeChangeDelegateModalLoaded selectedAccount={selectedAccount} />);
};

const enterDrepId = (drepId: string) =>
    fireEvent.change(screen.getByRole('textbox'), { target: { value: drepId } });

const getContinueButton = () => screen.getByRole('button', { name: 'TR_CONTINUE' });

describe('StakeChangeDelegateModal', () => {
    it.each([
        ['CIP-129', DREP_CIP129_KEY_HASH],
        ['legacy', DREP_CIP105_KEY_HASH],
        ['amended CIP-105', DREP_VKH_KEY_HASH],
    ])('blocks re-delegating to the current DRep entered in its %s spelling', (_, drepId) => {
        renderModal();

        enterDrepId(drepId);

        expect(getContinueButton()).toBeDisabled();
    });

    it('allows delegating to a different DRep', () => {
        renderModal();

        enterDrepId(CARDANO_EVERSTAKE_DREP.bech32);

        expect(getContinueButton()).toBeEnabled();
    });
});
