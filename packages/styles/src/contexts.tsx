import { createContext } from 'react';

import { Direction } from './types';

export const DirectionContext = createContext<Direction>('ltr');
