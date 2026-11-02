export type {
    AllowedOnlyInRule,
    ForbiddenDependency,
    ForbiddenDepsConfig,
} from './requirements/forbidden-deps/forbiddenDepsTypes';
export {
    type WorkspacePackage,
    collectProdWorkspaceClosure,
    collectWorkspacePackages,
} from './requirements/connectClosure';
