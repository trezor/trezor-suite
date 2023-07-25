import React from 'react';
import { WelcomeLayout, PrerequisitesGuide } from 'src/components/suite';
import type { PrerequisiteType } from 'src/types/suite';

interface PrerequisiteScreenProps {
    prerequisite: PrerequisiteType;
}

const PrerequisiteScreen = ({ prerequisite }: PrerequisiteScreenProps) => (
    <WelcomeLayout>
        <PrerequisitesGuide prerequisite={prerequisite} padded allowSwitchDevice />
    </WelcomeLayout>
);

export default PrerequisiteScreen;
