import { useDispatch as useReduxDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { Action, AppState } from 'src/types/suite';

export const useDispatch: () => ThunkDispatch<AppState, any, Action> = useReduxDispatch;
