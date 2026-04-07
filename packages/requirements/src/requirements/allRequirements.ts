import type { Requirement, RequirementScope } from './Requirement';
import { requireAgentsSkills } from './agents-skills/requireAgentsSkills';
import { requireUnifiedDependencyVersions } from './dependency-versions/requireUnifiedDependencyVersions';
import { requireDocsSummary } from './docs-summary/requireDocsSummary';
import { requirePackageJsonScripts } from './package-json/requirePackageJsonScripts';
import { requirePublishConfig } from './package-json/requirePublishConfig';

export const requirements: ReadonlyArray<Requirement<RequirementScope>> = [
    requireAgentsSkills,
    requireUnifiedDependencyVersions,
    requireDocsSummary,
    requirePackageJsonScripts,
    requirePublishConfig,
];
