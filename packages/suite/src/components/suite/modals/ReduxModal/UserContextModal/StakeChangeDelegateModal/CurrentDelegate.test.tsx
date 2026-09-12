import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { CurrentDelegate } from './CurrentDelegate';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

const EVERSTAKE_DREP_CIP105 = 'drep1ectemlv45xsnvenfgkhwsxncfvxev4qllj7x5w6vlfc7kmd9zcs';
const DREP_CIP105_KEY_HASH = 'drep1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknjmv589e';
const DREP_CIP129_KEY_HASH = 'drep1yfpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsqdglp';
const PREDEFINED_DREP_ID = 'drep_always_abstain';

const createCardanoAccount = (drepId: string): Account =>
    ({
        key: 'ada-account-key',
        index: 0,
        symbol: asNetworkSymbol('ada'),
        networkType: 'cardano',
        misc: { staking: { isActive: true, drep: { drep_id: drepId } } },
    }) as unknown as Account;

const renderCurrentDelegate = (drepId: string) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: mockInitialAppState,
        serializableCheck: { ignoredActions: [] },
    });

    renderWithProviders(root, <CurrentDelegate account={createCardanoAccount(drepId)} />);
};

describe('CurrentDelegate', () => {
    it.each([
        ['CIP-129', CARDANO_EVERSTAKE_DREP.bech32],
        ['legacy', EVERSTAKE_DREP_CIP105],
    ])('names Everstake behind its DRep reported in the %s spelling', (_, drepId) => {
        renderCurrentDelegate(drepId);

        expect(screen.getByText('Everstake')).toBeInTheDocument();
        expect(screen.getByText(CARDANO_EVERSTAKE_DREP.bech32)).toBeInTheDocument();
    });

    it('shows another DRep reported in the legacy spelling as CIP-129', () => {
        renderCurrentDelegate(DREP_CIP105_KEY_HASH);

        expect(screen.getByText('TR_STAKE_PROVIDER_UNKNOWN')).toBeInTheDocument();
        expect(screen.getByText(DREP_CIP129_KEY_HASH)).toBeInTheDocument();
        expect(screen.queryByText(DREP_CIP105_KEY_HASH)).not.toBeInTheDocument();
    });

    it('passes a predefined DRep through unchanged', () => {
        renderCurrentDelegate(PREDEFINED_DREP_ID);

        expect(screen.getByText(PREDEFINED_DREP_ID)).toBeInTheDocument();
    });
});
