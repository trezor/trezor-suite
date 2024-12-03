/**
 * Hack to workaround NodeJS.Timeout vs number type issue.
 *
 * Some reads on the topic:
 *  - https://stackoverflow.com/questions/45802988/typescript-use-correct-version-of-settimeout-node-vs-window
 *  - https://guilhermesimoes.github.io/blog/making-settimeout-return-number-in-typescript
 *
 */
export type TimerId = ReturnType<typeof setTimeout>;
export type ImmediateId = ReturnType<typeof setImmediate>;
export type IntervalId = ReturnType<typeof setInterval>;
