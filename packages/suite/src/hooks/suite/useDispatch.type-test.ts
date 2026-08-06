import { createThunk } from '@suite-common/redux-utils';

import type { SuiteExtra } from 'src/support/extraDependencies';
import type { AppState } from 'src/types/suite';

import type { useDispatch } from './useDispatch';

type AvailableState = Pick<AppState, 'wallet'>;
type UnavailableState = {
    unavailable: {
        value: string;
    };
};
type AvailableExtraDependencies = {
    services: Pick<SuiteExtra['services'], 'getLanguage'>;
};
type UnavailableExtraDependencies = {
    services: {
        unavailableDependency: () => void;
    };
};

const compatibleStateThunk = createThunk<void, void, { state: AvailableState }>(
    'test/compatibleStateThunk',
    () => {},
);
const incompatibleStateThunk = createThunk<void, void, { state: UnavailableState }>(
    'test/incompatibleStateThunk',
    () => {},
);
const compatibleExtraDependenciesThunk = createThunk<
    void,
    void,
    { extra: AvailableExtraDependencies }
>('test/compatibleExtraDependenciesThunk', () => {});
const incompatibleExtraDependenciesThunk = createThunk<
    void,
    void,
    { extra: UnavailableExtraDependencies }
>('test/incompatibleExtraDependenciesThunk', () => {});

declare const dispatch: ReturnType<typeof useDispatch>;

dispatch(compatibleStateThunk());

// @ts-expect-error The Suite store does not provide the state required by this thunk.
dispatch(incompatibleStateThunk());

dispatch(compatibleExtraDependenciesThunk());

// @ts-expect-error Suite does not provide the extra dependency required by this thunk.
dispatch(incompatibleExtraDependenciesThunk());
