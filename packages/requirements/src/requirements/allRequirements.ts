import type { Requirement, RequirementScope } from './Requirement';
import { requireAgentsSkills } from './agents-skills/requireAgentsSkills';
import { requireUnifiedDependencyVersions } from './dependency-versions/requireUnifiedDependencyVersions';
import { requireDocsSummary } from './docs-summary/requireDocsSummary';
import { requireForbiddenDeps } from './forbidden-deps/requireForbiddenDeps';
import { requireNativeTranslationKeys } from './generated-files/requireNativeTranslationKeys';
import { requireSuiteTranslationKeys } from './generated-files/requireSuiteTranslationKeys';
import { requirePackageJsonScripts } from './package-json/requirePackageJsonScripts';
import { requirePublishConfig } from './package-json/requirePublishConfig';
import { requireConnectPublicDependencies } from './public-package-dependencies/requireConnectPublicDependencies';

export const requirements: ReadonlyArray<Requirement<RequirementScope>> = [
    requireAgentsSkills,
    requireUnifiedDependencyVersions,
    requireConnectPublicDependencies,
    requireDocsSummary,
    requireForbiddenDeps,
    requireNativeTranslationKeys,
    requireSuiteTranslationKeys,
    requirePackageJsonScripts,
    requirePublishConfig,
];
