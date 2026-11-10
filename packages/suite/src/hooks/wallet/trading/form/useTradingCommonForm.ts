import { createContext, useContext } from 'react';

import type { TradingType } from '@suite-common/trading';
import { throwError } from '@trezor/utils';

import { type TradingFormContextValues } from '../../../../types/trading/tradingForm';

export const TradingFormContext = createContext<TradingFormContextValues<TradingType> | null>(null);
TradingFormContext.displayName = 'TradingFormContext';

export const useTradingFormContext = <T extends TradingType>() =>
    (useContext(TradingFormContext) as TradingFormContextValues<T>) ??
    throwError('TradingFormContext used without Context');
