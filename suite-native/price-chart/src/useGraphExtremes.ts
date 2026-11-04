import { useContext } from 'react';

import { GraphExtremesContext } from './GraphExtremesContext';

export const useGraphExtremes = () => useContext(GraphExtremesContext);
