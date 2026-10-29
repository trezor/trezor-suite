export type {
    AllowedOnlyInRule,
    ForbiddenDependency,
    ForbiddenDepsConfig,
} from './requirements/forbidden-deps/forbiddenDepsTypes';
export {
    CONNECT_PUBLISH_ROOTS,
    type WorkspacePackage,
    collectProdWorkspaceClosure,
    collectWorkspacePackages,
} from './requirements/connectClosure';
