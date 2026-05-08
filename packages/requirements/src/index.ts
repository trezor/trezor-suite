export type {
    AllowedOnlyInRule,
    ForbiddenDependency,
    ForbiddenDepsConfig,
} from './requirements/forbidden-deps/forbiddenDepsTypes';
export { computePublishClosure, createReadWorkspaceDeps, listWorkspacePackages } from './dep-graph';
export type { PackageDepsResolver, WorkspacePackage, WorkspacePackageJson } from './dep-graph';
