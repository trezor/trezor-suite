import { useDispatch as useReduxDispatch } from 'react-redux';

import { type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import type { ExtraDependenciesSuite } from 'src/support/extraDependencies';

type SuiteDispatch<State, Extra> = ExtraDependenciesSuite extends Extra
    ? ThunkDispatch<State, Extra, UnknownAction>
    : never;

export const useDispatch = useReduxDispatch as <
    State = never,
    Extra = ExtraDependenciesSuite,
>() => SuiteDispatch<State, Extra>;
