export type {
    AllowedOnlyInRule,
    ForbiddenDependency,
    ForbiddenDepsConfig,
} from './requirements/forbidden-deps/forbiddenDepsTypes';
export { computePublishClosure, createReadWorkspaceDeps } from './dep-graph';
export type { PackageDepsResolver } from './dep-graph';
