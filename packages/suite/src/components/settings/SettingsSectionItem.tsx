import { ReactNode } from 'react';

import { SectionItem } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface SettingsSectionItemProps {
    anchorId: SettingsAnchor;
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
