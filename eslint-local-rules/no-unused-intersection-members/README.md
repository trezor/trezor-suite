# Local ESLint rules

## Unused State and Deps contract members

`no-unused-intersection-members` checks explicit intersections and object properties in local
contract aliases. By default, aliases whose names end in `State` or `Deps` are contracts:

```ts
type RunDeps = LoggerDeps & StorageDeps;

const run = (deps: RunDeps) => deps.logger.log('started');
```

Here `StorageDeps` is reported because the implementation can satisfy every observed requirement
without it.

Intersections nested in an object contract are checked as well:

```ts
type RunDeps = { services: LoggerDeps & StorageDeps };

const run = (deps: RunDeps) => deps.services.logger.log('started');
```

Object properties are reportable contract members too:

```ts
type RunDeps = {
    logger: Logger;
    storage: Storage;
};

const run = (deps: RunDeps) => deps.logger.log('started');
```

Here the `storage` property is reported.

### Contract discovery

In addition to the default `State` and `Deps` suffixes, a type alias is treated as a contract when it
is used as:

- The `state` or `extra` type of a thunk factory configuration.
- The `deps` parameter of a `create*` dependency factory.

Projects can opt additional naming conventions into the analysis:

```js
{
    'local-rules/no-unused-intersection-members': [
        'error',
        { additionalTypeNameSuffixes: ['Context', 'Services'] },
    ],
}
```

Role-based discovery keeps thunk and DI contracts covered even when their names use another suffix,
while unrelated data types remain outside the rule by default.

An ordinary `*State` alias may describe persisted reducer data rather than a capability contract. To
avoid treating fields in that data model as locally removable, suffix-only `*State` aliases retain
the original root-intersection analysis. Nested intersections and object members are enabled when
the alias is identified as a thunk state contract.

### Principles

1. **Analyze requirements, not textual references.** A member may be needed through
   `deps.logger.log()`, a selector receiving the complete state, or a dispatched child thunk. Looking
   only for the member's type name would miss all of these cases.
2. **Treat contract members as capability providers.** Each observed usage becomes a property path
   such as `logger.log`, optionally paired with the type expected by a function parameter. The rule
   asks which members can provide that requirement.
3. **Account for structural composition.** A required type can be satisfied by properties spread
   across multiple intersection members. The rule recursively compares their combined properties
   rather than checking each member only in isolation.
4. **Look through service containers.** `WithServices<LoggerDep & StorageDep>` moves the intersection
   below the `services` property but does not make it a single capability. The inner dependency
   members are checked against usages such as `deps.services.logger` and child-thunk requirements.
5. **Include transitive thunk requirements.** Dispatching a child thunk implicitly requires the
   child's `state` and `extra` types. Those requirements count even if the parent thunk never calls
   `getState()` or reads `extra` itself. Thunk factories are recognized from their TypeScript
   signature, so aliases, namespace properties, named configuration types, extracted callbacks,
   `api.dispatch(...)`, and dispatch functions passed to typed helpers retain this analysis.
6. **Prefer false negatives over false positives.** When the analysis cannot prove which member is
   needed, it keeps the whole contract. The rule should suggest a removal only when that removal is
   demonstrably safe for every usage visible in the file.
7. **Stay local and predictable.** Candidates are explicit intersections and object properties
   within recognized contract aliases in the current source file, including intersections inside a
   transparent `services` container. Usage collection is file-local: a consumer needing an
   additional capability should declare it at the consumer instead of relying on a broader upstream
   alias. This avoids turning lint into an open-ended whole-program dependency
   analysis.

### Analysis stages

1. At `Program:exit`, collect matching aliases and resolve every root, nested, or service-wrapped
   intersection and object member with the TypeScript type checker.
2. Mark contracts as opaque when they enter a type-level context that the rule cannot safely
   interpret.
3. Read `createThunk` configuration and add the state/dependency requirements of dispatched child
   thunks.
4. Traverse runtime expressions and record property paths, expected argument types, and assignments.
5. For each member, compare all usages against both that member and the intersection with that member
   removed.
6. Report the member only when it does not provide a usage itself and all remaining members still
   satisfy every usage.

The first half of the final test is intentionally conservative. If two members both provide the same
capability, the rule keeps both instead of arbitrarily deciding which declaration should remain.

### Conservative fallbacks

The complete alias is kept when the implementation contains an ambiguous use, including:

- Dynamic access such as `deps[key]`.
- Passing the whole value to a call whose expected parameter type cannot be resolved.
- Deriving another type with `keyof`, indexed access, conditional or mapped types, or a public alias.
- Using the alias as a generic call or type argument outside supported contract composition.
- A bare value escaping without a property path or expected type.
- Recursive, callable, constructable, or indexed structures that cannot be safely composed from
  individual members.

Contracts with no observed runtime usages are also ignored. Other tooling is better suited to finding
entirely unused declarations.

### Type-aware execution

The rule requires TypeScript parser services and reuses their existing `Program` and `TypeChecker`. It
is enabled only when `ESLINT_RUN_EXPENSIVE_CHECKS=true`; normal editor and local lint runs do not pay
for this analysis.
