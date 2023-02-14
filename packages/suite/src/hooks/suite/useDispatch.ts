import { useDispatch as useReduxDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { Action, AppState } from '@suite-types';

export const useDispatch: () => ThunkDispatch<AppState, any, Action> = useReduxDispatch;
