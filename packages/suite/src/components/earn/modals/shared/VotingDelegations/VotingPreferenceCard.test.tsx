import '@suite-common/test-utils/globalOverrides';

import { type UnknownAction } from '@reduxjs/toolkit';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    getCardanoAccountDrepId,
    stakeActions,
    stakeInitialState,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { stakeReducer } from 'src/reducers/wallet';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { BASE_VOTING_PREFERENCE_OPTIONS, VotingPreferenceCard } from './VotingPreferenceCard';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const LEGACY_DREP_ID = 'drep1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknjmv589e';
const KEY_DREP_ID = 'drep1yfpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsqdglp';
const SCRIPT_DREP_ID = 'drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx';

const createAccount = (drep: { drep_id: string; has_script: boolean } | null = null) =>
    mockWalletAccount(
        { symbol: asNetworkSymbol('ada') },
        { misc: { staking: { isActive: true, drep } } },
    );

const renderCard = (account: Account = createAccount()) => {
    const preloadedState = {
        ...mockInitialAppState,
        wallet: { ...mockInitialAppState.wallet, stake: stakeInitialState },
    };
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState,
        reducer: (state = preloadedState, action: UnknownAction) => ({
            ...state,
            wallet: { ...state.wallet, stake: stakeReducer(state.wallet.stake, action) },
        }),
        serializableCheck: { ignoredActions: [] },
    });
    services.store.dispatch(
        stakeActions.setAccountVotingDelegation({
            accountKey: account.key,
            option: { type: 'another_drep', drepId: '' },
        }),
    );
    renderWithProviders(
        services,
        <VotingPreferenceCard
            account={account}
            heading="Voting preference"
            description="Choose a voting preference"
            options={BASE_VOTING_PREFERENCE_OPTIONS}
            currentDrepId={getCardanoAccountDrepId(account)}
        />,
    );

    return { user: userEvent.setup(), input: screen.getByRole('textbox') };
};

const convertedMessage = messages.TR_STAKING_DREP_ID_CONVERTED.defaultMessage;
const legacyFormatMessage = messages.TR_STAKING_DREP_ID_LEGACY_FORMAT.defaultMessage;
const convertButtonText = messages.TR_STAKING_CONVERT_DREP_ID.defaultMessage;
const currentDelegateMessage = messages.TR_STAKING_DREP_ID_IS_CURRENT_DELEGATE.defaultMessage;

describe('VotingPreferenceCard DRep input', () => {
    it.each([LEGACY_DREP_ID, LEGACY_DREP_ID.toUpperCase()])(
        'keeps a pasted legacy id until the user converts it: %s',
        async value => {
            const { user, input } = renderCard();
            await user.click(input);
            await user.paste(value);

            expect(input).toHaveValue(value);
            expect(screen.getByText(legacyFormatMessage)).toBeVisible();
            expect(screen.queryByText(convertedMessage)).toBeNull();

            await user.click(screen.getByRole('button', { name: convertButtonText }));

            expect(input).toHaveValue(KEY_DREP_ID);
            expect(screen.getByText(convertedMessage)).toBeVisible();
            expect(screen.queryByText(legacyFormatMessage)).toBeNull();
        },
    );

    it('hides the conversion feedback once the converted id is edited', async () => {
        const { user, input } = renderCard();
        await user.click(input);
        await user.paste(LEGACY_DREP_ID);
        await user.click(screen.getByRole('button', { name: convertButtonText }));
        await user.type(input, '{Backspace}');

        expect(screen.queryByText(convertedMessage)).toBeNull();
    });

    it.each([LEGACY_DREP_ID, LEGACY_DREP_ID.toUpperCase()])(
        'recognizes the current script delegate pasted in its legacy spelling: %s',
        async value => {
            const { user, input } = renderCard(
                createAccount({ drep_id: LEGACY_DREP_ID, has_script: true }),
            );
            await user.click(input);
            await user.paste(value);

            expect(input).toHaveValue(value);
            expect(screen.getByText(currentDelegateMessage)).toBeVisible();
            expect(screen.queryByRole('button', { name: convertButtonText })).toBeNull();
        },
    );

    it('allows an explicit key credential with the same hash as the current script credential', async () => {
        const { user, input } = renderCard(
            createAccount({ drep_id: LEGACY_DREP_ID, has_script: true }),
        );
        await user.click(input);
        await user.paste(KEY_DREP_ID);

        expect(input).toHaveValue(KEY_DREP_ID);
        expect(screen.queryByText(currentDelegateMessage)).toBeNull();
        expect(screen.queryByText(legacyFormatMessage)).toBeNull();
    });

    it.each([KEY_DREP_ID, SCRIPT_DREP_ID])(
        'leaves an uppercase canonical id as typed: %s',
        async canonicalId => {
            const { user, input } = renderCard();
            await user.click(input);
            await user.paste(canonicalId.toUpperCase());

            expect(input).toHaveValue(canonicalId.toUpperCase());
            expect(screen.queryByText(legacyFormatMessage)).toBeNull();
            expect(screen.queryByText(convertedMessage)).toBeNull();
        },
    );

    it('still rejects mixed-case input matching the current backend id', async () => {
        const { user, input } = renderCard(
            createAccount({ drep_id: LEGACY_DREP_ID, has_script: true }),
        );
        const mixedCaseId = LEGACY_DREP_ID.replace('drep', 'Drep');
        await user.click(input);
        await user.paste(mixedCaseId);

        expect(input).toHaveValue(mixedCaseId);
        expect(screen.getByText(messages.TR_STAKING_INVALID_DREP_ID.defaultMessage)).toBeVisible();
        expect(screen.queryByRole('button', { name: convertButtonText })).toBeNull();
    });
});
