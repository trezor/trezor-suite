import { type ReactNode } from 'react';

import { type SettingsAnchorValue } from '@suite/router';
import { SectionItem } from '@trezor/product-components';

import { useAnchor } from 'src/hooks/suite/useAnchor';

type SettingsSectionItemProps = {
    anchorId: SettingsAnchorValue;
    children: ReactNode;
};

/**
 * Should be moved to @trezor/product-components as soon as possible.
 * Cant be moved now due to useAnchor hook.
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
