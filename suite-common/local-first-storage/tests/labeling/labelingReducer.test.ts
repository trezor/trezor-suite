import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { asWalletDescriptor } from '@suite-common/wallet-types';

import { setWalletLabel } from '../../src/labeling/labelingActions';
import { LabelingState, prepareLabelingReducer } from '../../src/labeling/labelingReducer';

const labelingReducer = prepareLabelingReducer(extraDependenciesMock);

const initialState: LabelingState = {
    walletsLabels: {},
};

const walletDescriptor = asWalletDescriptor('mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');

describe('labelingReducer', () => {
    it('sets wallet label', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: initialState },
        });

        expect(store.getState().labeling.walletsLabels).toEqual({});
        store.dispatch(setWalletLabel({ walletDescriptor, label: 'Drugs and Hoes' }));
        expect(store.getState().labeling.walletsLabels).toEqual({
            mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q: {
                accountLabels: [],
                addressLabels: [],
                outputLabels: [],
                walletLabel: 'Drugs and Hoes',
            },
        });
    });
});
