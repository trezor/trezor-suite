import { createContext, useContext } from 'react';

import { type TypographyStyle } from '@trezor/theme';

interface TableContextProps {
    isRowHighlightedOnHover: boolean;
    hasBorders: boolean;
    typographyStyle: TypographyStyle;
}

const TableContext = createContext<TableContextProps>({
    isRowHighlightedOnHover: false,
    hasBorders: true,
    typographyStyle: 'body-md',
});

export const useTable = () => useContext(TableContext);
export { TableContext };
export type { TableContextProps };
