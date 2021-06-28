import React from 'react';
import { WelcomeLayout, PrerequisitesGuide } from '@suite-components';
import type { PrerequisiteType } from '@suite-types';

interface Props {
    prerequisite: PrerequisiteType;
}

const PrerequisiteScreen = ({ prerequisite }: Props) => (
    <WelcomeLayout>
        <PrerequisitesGuide prerequisite={prerequisite} padded />
    </WelcomeLayout>
);

export default PrerequisiteScreen;
