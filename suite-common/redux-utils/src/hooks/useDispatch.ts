// eslint-disable-next-line no-restricted-syntax -- This adapter is the boundary that wraps React Redux.
import { useDispatch as useReduxDispatch } from 'react-redux';

import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

export type Dispatch = ThunkDispatch<any, any, UnknownAction>;

export const useDispatch = () => useReduxDispatch<Dispatch>();
