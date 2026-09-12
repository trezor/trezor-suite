import '@suite-common/test-utils/globalOverrides';

import { type UnknownAction } from '@reduxjs/toolkit';
import { fireEvent, screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { stakeInitialState } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { stakeReducer } from 'src/reducers/wallet';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { VotingDelegationsOptions } from './VotingDelegationsOptions';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

const DREP_CIP105_SCRIPT_HASH = 'drep_script1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknj5wf0ec';
const DREP_VKH_KEY_HASH = 'drep_vkh1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknjat06vr';
const DREP_CIP129_SCRIPT_HASH = 'drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx';
const DREP_CIP129_KEY_HASH = 'drep1yfpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsqdglp';
const ACCOUNT_KEY = 'ada-account-key' as AccountKey;

const cardanoAccount = {
    key: ACCOUNT_KEY,
    index: 0,
    symbol: asNetworkSymbol('ada'),
    networkType: 'cardano',
} as unknown as Account;

const renderDrepIdInput = () => {
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

    renderWithProviders(root, <VotingDelegationsOptions account={cardanoAccount} />);

    return screen.getByRole('textbox');
};

describe('VotingDelegationsOptions', () => {
    it.each([
        ['a CIP-105 script hash', DREP_CIP105_SCRIPT_HASH, DREP_CIP129_SCRIPT_HASH],
        ['an amended CIP-105 key hash', DREP_VKH_KEY_HASH, DREP_CIP129_KEY_HASH],
    ])('converts %s to CIP-129 and says so', (_, drepId, convertedDrepId) => {
        const input = renderDrepIdInput();

        fireEvent.change(input, { target: { value: drepId } });

        expect(input).toHaveValue(convertedDrepId);
        expect(screen.getByText('TR_STAKING_DREP_ID_CONVERTED')).toBeInTheDocument();
    });

    it('keeps a CIP-129 id as it is and shows no notice', () => {
        const input = renderDrepIdInput();

        fireEvent.change(input, { target: { value: DREP_CIP129_SCRIPT_HASH } });

        expect(input).toHaveValue(DREP_CIP129_SCRIPT_HASH);
        expect(screen.queryByText('TR_STAKING_DREP_ID_CONVERTED')).not.toBeInTheDocument();
    });

    it('drops the notice once the converted id is edited into an invalid one', () => {
        const input = renderDrepIdInput();

        fireEvent.change(input, { target: { value: DREP_CIP105_SCRIPT_HASH } });
        fireEvent.change(input, { target: { value: `${DREP_CIP129_SCRIPT_HASH}x` } });

        expect(screen.queryByText('TR_STAKING_DREP_ID_CONVERTED')).not.toBeInTheDocument();
        expect(screen.getByText('TR_STAKING_INVALID_DREP_ID')).toBeInTheDocument();
    });

    it('keeps a value that is not a DRep id and reports it as invalid', () => {
        const input = renderDrepIdInput();

        fireEvent.change(input, { target: { value: 'not-a-drep' } });

        expect(input).toHaveValue('not-a-drep');
        expect(screen.getByText('TR_STAKING_INVALID_DREP_ID')).toBeInTheDocument();
    });
});
