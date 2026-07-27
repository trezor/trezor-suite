import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { type ModalIntent } from './types';

export const ModalContext = createContext<{
    intent?: ModalIntent;
}>({ intent: undefined });

export const useModalContext = () =>
    useContext(ModalContext) ?? throwError('useModalContext must be used within a ModalContext');
