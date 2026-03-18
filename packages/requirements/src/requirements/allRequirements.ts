import type { Requirement, RequirementScope } from './Requirement';
import { requireAgentsSkills } from './agents-skills/requireAgentsSkills';
import { requirePackageJsonScripts } from './package-json/requirePackageJsonScripts';
import { requireTsconfig } from './tsconfig/requireTsconfig';

export const requirements: ReadonlyArray<Requirement<RequirementScope>> = [
    requireAgentsSkills,
    requirePackageJsonScripts,
    requireTsconfig,
];
