import { ReactNode } from 'react';

import { SectionItem } from 'src/components/suite';
import { SettingsAnchorValue } from 'src/constants/suite/anchors';
import { useAnchor } from 'src/hooks/suite/useAnchor';

interface SettingsSectionItemProps {
    anchorId: SettingsAnchorValue;
    children: ReactNode;
}

export const SettingsSectionItem = ({ anchorId, children }: SettingsSectionItemProps) => {
    const { anchorRef, shouldHighlight } = useAnchor(anchorId);

    return (
        <SectionItem data-testid={anchorId} ref={anchorRef} shouldHighlight={shouldHighlight}>
            {children}
        </SectionItem>
    );
};
