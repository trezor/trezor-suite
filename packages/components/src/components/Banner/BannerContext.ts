import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { DEFAULT_INTENT } from './consts';
import { type BannerIntent } from './types';

export const BannerContext = createContext<{
    intent?: BannerIntent;
}>({ intent: DEFAULT_INTENT });

export const useBannerContext = () =>
    useContext(BannerContext) ??
    throwError('useBannerContextContext must be used within a BannerContext');
