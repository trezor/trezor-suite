import { ReactNode } from 'react';

import { SettingsAnchorValue } from '@suite/router';

import { SectionItem } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';

type SettingsSectionItemProps = {
    anchorId: SettingsAnchorValue;
    children: ReactNode;
};

export const SettingsSectionItem = ({ anchorId, children }: SettingsSectionItemProps) => {
    const { anchorRef, shouldHighlight } = useAnchor(anchorId);

    return (
        <SectionItem data-testid={anchorId} ref={anchorRef} shouldHighlight={shouldHighlight}>
            {children}
        </SectionItem>
    );
};
