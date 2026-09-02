# @suite-common/extra-dependencies

Legacy dependency contracts used by the desktop and Native composition roots.

`CommonServices` combines the services that both applications provide. Feature code must depend on
the smallest domain-owned service contracts it uses instead of importing `CommonServices`.

`ExtraDependenciesStatic` describes the remaining Redux thunks, actions, action types, and reducers
that have not yet been replaced by domain-owned dependencies. Do not add new dependencies to this
contract.

Only the application composition roots may import this package. This boundary is enforced by
`forbiddenDeps.config.ts`.
