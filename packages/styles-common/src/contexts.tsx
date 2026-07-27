import { createContext } from 'react';

import { type Direction } from './types';

export const DirectionContext = createContext<Direction>('ltr');
