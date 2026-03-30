import { type ReactNode } from 'react';

import { type SettingsAnchorValue, useAnchor } from '@suite/router';
import { SectionItem } from '@trezor/product-components';

type SettingsSectionItemProps = {
    anchorId: SettingsAnchorValue;
    children: ReactNode;
};

/**
 * Should be moved to @trezor/product-components as soon as possible.
 * @deprecated
 */
export const SettingsSectionItem = ({ anchorId, children }: SettingsSectionItemProps) => {
    const { anchorRef, shouldHighlight } = useAnchor(anchorId);

    return (
        <SectionItem data-testid={anchorId} ref={anchorRef} shouldHighlight={shouldHighlight}>
            {children}
        </SectionItem>
    );
};
