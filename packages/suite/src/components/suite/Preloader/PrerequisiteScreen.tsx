import { WelcomeLayout, PrerequisitesGuide } from 'src/components/suite';
import type { PrerequisiteType } from 'src/types/suite';

interface PrerequisiteScreenProps {
    prerequisite: PrerequisiteType;
}

export const PrerequisiteScreen = ({ prerequisite }: PrerequisiteScreenProps) => (
    <WelcomeLayout>
        <PrerequisitesGuide prerequisite={prerequisite} allowSwitchDevice />
    </WelcomeLayout>
);
