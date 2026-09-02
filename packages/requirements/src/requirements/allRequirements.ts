import type { Requirement, RequirementScope } from './Requirement';
import { requireAgentsSkills } from './agents-skills/requireAgentsSkills';
import { requireUnifiedDependencyVersions } from './dependency-versions/requireUnifiedDependencyVersions';
import { requireDocsSummary } from './docs-summary/requireDocsSummary';
import { requireFirmwareReleaseVersionMonotonicity } from './firmware-releases/requireFirmwareReleaseVersionMonotonicity';
import { requireForbiddenDeps } from './forbidden-deps/requireForbiddenDeps';
import { requirePackageJsonScripts } from './package-json/requirePackageJsonScripts';
import { requirePublishConfig } from './package-json/requirePublishConfig';
import { requireConnectPublicDependencies } from './public-package-dependencies/requireConnectPublicDependencies';
import { requireTestColocation } from './test-colocation/requireTestColocation';
import { requireTypeDeclarationSize } from './type-declarations/requireTypeDeclarationSize';

export const requirements: ReadonlyArray<Requirement<RequirementScope>> = [
    requireAgentsSkills,
    requireUnifiedDependencyVersions,
    requireConnectPublicDependencies,
    requireDocsSummary,
    requireFirmwareReleaseVersionMonotonicity,
    requireForbiddenDeps,
    requirePackageJsonScripts,
    requirePublishConfig,
    requireTestColocation,
    requireTypeDeclarationSize,
];
