import { REACT_COMPILER_PATHS } from './reactCompiler';
import { evaluateFrozenReadReport, scanDirectories } from './reactCompilerFrozenReads';

/**
 * Fails the build when a tree the React Compiler compiles reads `react-hook-form` imperatively
 * during render. See `reactCompilerFrozenReads.ts` for why nothing else in the repository can catch
 * that, and `plans/react-compiler-rollout.md` for the rollout this gate belongs to.
 *
 * Deliberately not a jest test: `@trezor/suite-build` does not depend on `@trezor/suite`, so Nx
 * would serve a cached pass for the very tree this exists to protect.
 */
(() => {
    const logLabel = 'React Compiler frozen form reads checked in';
    console.time(logLabel);

    const report = scanDirectories();
    const failures = evaluateFrozenReadReport(report);

    console.log(
        `Compiled ${report.compiled} of ${report.files} file(s) under ` +
            `${REACT_COMPILER_PATHS.join(', ') || '<no wave enabled>'} and examined ` +
            `${report.guards} memo-cache guard(s).`,
    );

    // Advisory: caching one of these freezes a value that should differ per render. Nothing in scope
    // has one today, and wave 3 (`packages/components`) will — `Timerange.tsx` caches a `new Date()`.
    report.impureCaches.forEach(({ file, line, column, global: name, owner }) =>
        console.warn(
            `Advisory ${file}:${line}:${column}  ${name} cached for the life of ` +
                `${owner ?? '<anonymous>'}.`,
        ),
    );

    if (failures.length > 0) {
        failures.forEach(failure => console.error(`Error: ${failure}`));
        console.error(
            `\n${failures.length} problem(s) found. A green ESLint run and a green jest run cannot ` +
                `see any of them.`,
        );
        process.exit(1);
    }

    console.timeEnd(logLabel);
})();
