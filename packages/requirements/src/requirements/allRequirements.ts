import type { Requirement, RequirementScope } from './Requirement';
import { requireAgentsSkills } from './agents-skills/requireAgentsSkills';
import { requireDocsSummary } from './docs-summary/requireDocsSummary';
import { requirePackageJsonScripts } from './package-json/requirePackageJsonScripts';
import { requireTypecheckConfig } from './typecheck-config/requireTypecheckConfig';

export const requirements: ReadonlyArray<Requirement<RequirementScope>> = [
    requireAgentsSkills,
    requireDocsSummary,
    requirePackageJsonScripts,
    requireTypecheckConfig,
];
