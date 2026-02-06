import { useDispatch } from 'react-redux';

import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import type { ExtraDependencies } from '@suite-common/redux-utils';

export type SuiteDispatch = ThunkDispatch<any, ExtraDependencies, UnknownAction>;

export const useThunkDispatch = useDispatch.withTypes<SuiteDispatch>();
