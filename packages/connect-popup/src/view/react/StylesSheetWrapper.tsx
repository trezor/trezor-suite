import { ReactNode } from 'react';
import { StyleSheetManager } from 'styled-components';

interface StyleSheetWrapperProps {
    children: ReactNode;
}

export const StyleSheetWrapper = ({ children }: StyleSheetWrapperProps) => {
    const styleSlot = document.getElementById('react');

    if (!styleSlot?.shadowRoot) {
        console.error('could not find shadow-root to mount react application');
    }

    // @ts-expect-error. typings don't like using shadowRoot as target but it works
    return <StyleSheetManager target={styleSlot.shadowRoot!}>{children}</StyleSheetManager>;
};
