import { useDispatch as useReduxDispatch } from 'react-redux';

import type { ThunkDispatch } from 'redux-thunk';

import type { Action, AppState } from 'src/types/suite';

export const useDispatch: () => ThunkDispatch<AppState, any, Action> = useReduxDispatch;
