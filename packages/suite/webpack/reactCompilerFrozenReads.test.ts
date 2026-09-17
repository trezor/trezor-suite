import { parseSync, types as t } from '@babel/core';

import { REACT_COMPILER_PATHS } from './reactCompiler';
import {
    type FrozenReadFinding,
    type FrozenReadReport,
    analyseCompiledModule,
    classifyCompilerOptOut,
    compileForAnalysis,
    evaluateFrozenReadReport,
    evaluateOptOutSnapshot,
    findSuppressedFile,
    formatOptOutSnapshot,
    scanDirectories,
} from './reactCompilerFrozenReads';

/**
 * The corpus scan finds nothing while every compiled tree is remediated, so it proves the wave is
 * clean but says nothing about whether the detector still detects. These fixtures are what stops it
 * quietly becoming a permanent pass — every expectation below is the measured output of
 * `babel-plugin-react-compiler@1.0.0`, not a guess.
 */
const analyse = (source: string, filename = 'fixture.tsx') => {
    const compiled = compileForAnalysis(source, filename);

    if ('error' in compiled) {
        throw new Error(`fixture failed to compile: ${compiled.error}`);
    }

    return analyseCompiledModule(compiled.ast, filename);
};

const describeFinding = ({ accessor, kind, line }: FrozenReadFinding) =>
    `${accessor} ${kind} ${line}`;

const FORM_CONTEXT_IMPORT = `import { useFormContext } from 'react-hook-form';`;

describe('analyseCompiledModule', () => {
    it('reports a render-body read of a destructured accessor', () => {
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
export const Amount = () => {
    const { watch } = useFormContext();
    const value = watch('amount');

    return <span>{value}</span>;
};
`);

        expect(findings.map(describeFinding)).toEqual(['watch render-read 4']);
        expect(findings[0]?.owner).toBe('Amount');
        expect(findings[0]?.depCount).toBe(1);
    });

    it('ignores a read inside an event handler, which runs long after render', () => {
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
export const Amount = () => {
    const { watch } = useFormContext();
    const onClick = () => watch('amount');

    return <button onClick={onClick} />;
};
`);

        expect(findings).toEqual([]);
    });

    it('names the accessor, not the object it is called on', () => {
        // `rootName(form.getValues)` would be `form`, which no accessor list can ever match.
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
export const Amount = () => {
    const form = useFormContext();
    const value = form.getValues('amount');

    return <span>{value}</span>;
};
`);

        expect(findings.map(describeFinding)).toEqual(['getValues render-read 4']);
    });

    it('reports a read inside a callback that still runs during render', () => {
        // The compiler outlines the arrow to its own temporary, so the binding has to be followed.
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
type AmountsProps = { names: string[] };

export const Amounts = ({ names }: AmountsProps) => {
    const { watch } = useFormContext();

    return <div>{names.map(name => <span key={name}>{watch(name)}</span>)}</div>;
};
`);

        expect(findings.map(describeFinding)).toEqual(['watch render-callback 7']);
    });

    it('does not mistake an effect body for a render-evaluated callback', () => {
        // The compiler emits `useEffect(t0, t1)` at render level; `t0` is the effect body.
        const { findings } = analyse(`import { useEffect } from 'react';
${FORM_CONTEXT_IMPORT}
export const Amount = () => {
    const { getValues } = useFormContext();

    useEffect(() => {
        console.log(getValues('amount'));
    }, [getValues]);

    return null;
};
`);

        expect(findings).toEqual([]);
    });

    it('reports a read the compiler inlined out of an IIFE', () => {
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
export const Amount = () => {
    const { watch } = useFormContext();
    const value = (() => watch('amount'))();

    return <span>{value}</span>;
};
`);

        expect(findings.map(({ accessor, kind }) => `${accessor} ${kind}`)).toEqual([
            'watch render-read',
        ]);
    });

    it('reports both branches of a conditional read', () => {
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
type AmountProps = { isEditing: boolean };

export const Amount = ({ isEditing }: AmountProps) => {
    const { watch, getValues } = useFormContext();
    let value;

    if (isEditing) {
        value = watch('amount');
    } else {
        value = getValues('amount');
    }

    return <span>{value}</span>;
};
`);

        expect(findings.map(describeFinding).sort()).toEqual([
            'getValues render-read 11',
            'watch render-read 9',
        ]);
    });

    it('reports reads inside a ternary and a logical expression', () => {
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
type AmountProps = { isEditing: boolean };

export const Amount = ({ isEditing }: AmountProps) => {
    const { watch, getValues } = useFormContext();
    const value = isEditing ? watch('amount') : getValues('amount');
    const fee = isEditing && watch('fee');

    return <span>{value}{fee}</span>;
};
`);

        expect(findings.map(describeFinding).sort()).toEqual([
            'getValues render-read 6',
            'watch render-read 6',
            'watch render-read 7',
        ]);
    });

    it('sees nothing in a file that opted out at file level', () => {
        const { findings, guards } = analyse(`'use no memo';
${FORM_CONTEXT_IMPORT}
export const Amount = () => {
    const { watch } = useFormContext();

    return <span>{watch('amount')}</span>;
};
`);

        expect(findings).toEqual([]);
        expect(guards).toBe(0);
    });

    it('sees only the component that did not opt out at function level', () => {
        // The shape every remediated file in `packages/suite` uses.
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
export const OptedOut = () => {
    'use no memo';

    const { watch } = useFormContext();

    return <span>{watch('amount')}</span>;
};

export const Compiled = () => {
    const { watch } = useFormContext();

    return <span>{watch('fee')}</span>;
};
`);

        expect(findings.map(({ accessor, owner }) => `${accessor} ${owner}`)).toEqual([
            'watch Compiled',
        ]);
    });

    it('reports a guard shape it does not model instead of skipping it', () => {
        // Hand-written rather than compiled: the point is a shape this compiler version never emits.
        const ast = parseSync(
            `const Component = () => {
    const $ = _c(2);
    let t0;
    if ($[0] > limit) {
        t0 = watch('amount');
        $[1] = t0;
    }

    return t0;
};
`,
            { babelrc: false, configFile: false, sourceType: 'module' },
        );

        expect(t.isFile(ast)).toBe(true);

        const { unknownGuardShapes, findings } = analyseCompiledModule(ast as t.File, 'hand.js');

        expect(unknownGuardShapes).toHaveLength(1);
        expect(findings).toEqual([]);
    });

    it('reports an impure global cached behind the first-render sentinel', () => {
        const { impureCaches, findings } = analyse(`export const Clock = () => {
    const startedAt = new Date();

    return <span>{startedAt.toISOString()}</span>;
};
`);

        expect(findings).toEqual([]);
        expect(impureCaches.map(({ global: name, owner }) => `${name} ${owner}`)).toEqual([
            'new Date() Clock',
        ]);
    });

    it('does not see an accessor renamed while destructuring', () => {
        // A known gap, pinned so closing it is a deliberate change rather than a surprise.
        const { findings } = analyse(`${FORM_CONTEXT_IMPORT}
export const Amount = () => {
    const { watch: readField } = useFormContext();

    return <span>{readField('amount')}</span>;
};
`);

        expect(findings).toEqual([]);
    });
});

/**
 * The second channel: an impure value the compiler leaves at render level, captured by a closure it
 * caches. `ConnectionGlobalModalContext.tsx` shipped this — a Bluetooth liveness cut-off that stopped
 * advancing after the first render, so a device that went silent never dropped off the list.
 */
describe('analyseCompiledModule — frozen captures', () => {
    const NEARBY = `const LIMIT = 3000;

export const Nearby = ({ allDevices }) => {
    const boundary = Date.now() - LIMIT;

    const devices = allDevices.filter(it => it.updatedAt < boundary);

    return <span>{devices.length}</span>;
};
`;

    it('reports a render-level impure value captured by a cached closure', () => {
        const { frozenCaptures } = analyse(NEARBY);

        expect(frozenCaptures).toEqual([
            {
                file: 'fixture.tsx',
                line: 6,
                column: 38,
                global: 'Date.now()',
                binding: 'boundary',
                readLine: 4,
                owner: 'Nearby',
                // A sentinel guard: the predicate is built on the first render and never again.
                depCount: 0,
            },
        ]);
    });

    it('says nothing once the impure read moves inside the closure', () => {
        // The fix. The compiler outlines the now-capture-free predicate to module scope, so there is
        // no cache slot left to freeze and the read happens on every call.
        const { frozenCaptures } = analyse(`const LIMIT = 3000;

export const Nearby = ({ allDevices }) => {
    const devices = allDevices.filter(it => it.updatedAt < Date.now() - LIMIT);

    return <span>{devices.length}</span>;
};
`);

        expect(frozenCaptures).toEqual([]);
    });

    it('follows impurity into a value derived from it', () => {
        const { frozenCaptures } = analyse(`const LIMIT = 3000;

export const Nearby = ({ allDevices }) => {
    const now = Date.now();
    const boundary = now - LIMIT;

    const devices = allDevices.filter(it => it.updatedAt < boundary);

    return <span>{devices.length}</span>;
};
`);

        // One finding, not two: `now` itself is never captured, only the value derived from it.
        expect(frozenCaptures.map(({ binding, readLine }) => `${binding} ${readLine}`)).toEqual([
            'boundary 4',
        ]);
    });

    it('reports the outermost cached closure once when closures nest', () => {
        const { frozenCaptures } = analyse(`const LIMIT = 3000;

export const Nearby = ({ groups }) => {
    const boundary = Date.now() - LIMIT;

    const live = groups.map(group => group.devices.filter(it => it.updatedAt < boundary));

    return <span>{live.length}</span>;
};
`);

        expect(frozenCaptures.map(({ line }) => line)).toEqual([6]);
    });

    it('ignores a name inside the closure that shadows the impure binding', () => {
        const { frozenCaptures } = analyse(`const LIMIT = 3000;

export const Nearby = ({ allDevices }) => {
    const boundary = Date.now() - LIMIT;

    const devices = allDevices.filter(it => {
        const boundary = it.updatedAt;

        return boundary > LIMIT;
    });

    return <span>{devices.length + boundary}</span>;
};
`);

        expect(frozenCaptures).toEqual([]);
    });

    it('says nothing about an impure read no cached closure captures', () => {
        // `RotatingFacts.tsx` does exactly this on purpose: a suppressed `Math.random()` seeding
        // `useState`. This channel is `impure ∩ frozen`, not a second `react-hooks/purity`.
        const { frozenCaptures } = analyse(`import { useState } from 'react';

export const RotatingFacts = ({ facts }) => {
    const start = Math.floor(Math.random() * facts.length);
    const [index, setIndex] = useState(start);

    return <button onClick={() => setIndex(index + 1)}>{facts[index]}</button>;
};
`);

        expect(frozenCaptures).toEqual([]);
    });

    it('says nothing when the impure read lives in a helper the closure calls', () => {
        // The existing assumption `collectImpureCaches` gets right — there is no render-scoped
        // binding to go stale, because the helper reads the clock when it runs.
        const { frozenCaptures } =
            analyse(`const isExpired = (deadline: number) => deadline < Date.now();

export const Session = ({ deadline, onPing }) => {
    const onClick = () => onPing(isExpired(deadline));

    return <button onClick={onClick} />;
};
`);

        expect(frozenCaptures).toEqual([]);
    });

    it('says nothing about an impure read inside an effect', () => {
        const { frozenCaptures } = analyse(`import { useEffect } from 'react';

export const Timed = ({ onDone }) => {
    useEffect(() => {
        const startedAt = Date.now();

        return () => onDone(Date.now() - startedAt);
    }, [onDone]);

    return <span />;
};
`);

        expect(frozenCaptures).toEqual([]);
    });

    it('leaves a cached `new Date()` to the impure-cache channel, so no site is reported twice', () => {
        // `Date.now()` returns a primitive and stays at render level; `new Date()` allocates, so the
        // compiler hoists it into a sentinel of its own. That makes the binding non-constant, which
        // is what keeps the two channels disjoint.
        const { frozenCaptures, impureCaches } = analyse(`export const Clock = ({ stamps }) => {
    const openedAt = new Date();

    const fresh = stamps.filter(it => it > openedAt);

    return <span>{fresh.length}</span>;
};
`);

        expect(frozenCaptures).toEqual([]);
        expect(impureCaches.map(({ global: name }) => name)).toEqual(['new Date()']);
    });

    it('does not report a closure whose guard already depends on the impure value', () => {
        // `babel-plugin-react-compiler@1.0.0` never emits this — it treats `Date.now()` as
        // non-reactive and always sentinel-caches the closure — so the shape is hand-written. It is
        // here because a compiler that started tracking the read would otherwise turn every such
        // site into a false positive on the day of the upgrade.
        const ast = parseSync(
            `const Component = ({ items }) => {
    const $ = _c(2);
    const now = Date.now();
    let t0;
    if ($[0] !== now) {
        t0 = items.filter(it => it.at > now);
        $[0] = now;
        $[1] = t0;
    } else {
        t0 = $[1];
    }

    return t0;
};
`,
            { babelrc: false, configFile: false, sourceType: 'module' },
        );

        expect(t.isFile(ast)).toBe(true);

        expect(analyseCompiledModule(ast as t.File, 'hand.js').frozenCaptures).toEqual([]);
    });
});

describe('findSuppressedFile', () => {
    const inspect = (source: string, filename = 'fixture.tsx') => {
        const compiled = compileForAnalysis(source, filename);

        if ('error' in compiled) {
            throw new Error(`fixture failed to compile: ${compiled.error}`);
        }

        return findSuppressedFile(source, filename, filename, compiled.ast);
    };

    const SUPPRESSED_COMPONENT = `import { useEffect } from 'react';

type ThingProps = { items: string[]; other: string };

export const Thing = ({ items, other }: ThingProps) => {
    useEffect(() => {
        console.log(other);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    return <span>{items.join(',')}</span>;
};
`;

    it('reports a component the compiler skips only because of a suppression', () => {
        // The shape that let `useSendForm.ts` sit uncompiled inside a compiled tree unnoticed.
        expect(inspect(SUPPRESSED_COMPONENT)).toEqual({
            file: 'fixture.tsx',
            caches: 0,
            cachesWithoutSuppressions: 1,
        });
    });

    it('says nothing about a file with no suppression', () => {
        expect(inspect(SUPPRESSED_COMPONENT.replace(/^.*eslint-disable.*\n/m, ''))).toBeNull();
    });

    it('says nothing once the opt-out is deliberate', () => {
        // `'use no memo'` already tells the next reader; a second warning would be noise.
        expect(inspect(`'use no memo';\n${SUPPRESSED_COMPONENT}`)).toBeNull();
    });

    it('ignores a suppression for a rule the compiler does not honour', () => {
        expect(
            inspect(SUPPRESSED_COMPONENT.replace('react-hooks/exhaustive-deps', 'no-console')),
        ).toBeNull();
    });
});

/**
 * 53 files in the enabled trees are silently not compiled because the compiler refuses them, and
 * three of those bails are load-bearing — `views/wallet/send/Outputs/Address.tsx` most of all, where
 * lifting the bail makes `analyseCompiledModule` produce five findings the gate would fail on. The
 * snapshot is what turns "the compiler quietly changed its mind about a file" into a red build.
 */
describe('classifyCompilerOptOut', () => {
    const classify = (source: string, filename = 'fixture.tsx') => {
        const compiled = compileForAnalysis(source, filename);

        if ('error' in compiled) {
            throw new Error(`fixture failed to compile: ${compiled.error}`);
        }

        return classifyCompilerOptOut(source, filename, compiled.ast, compiled.events);
    };

    const COMPONENT = `export const Amount = ({ items }) => {
    const total = items.reduce((sum, it) => sum + it.value, 0);

    return <span>{total}</span>;
};
`;

    it('says nothing about a file the compiler fully compiles', () => {
        expect(classify(COMPONENT)).toBeNull();
    });

    it('says nothing about a file the compiler never had an opinion on', () => {
        // Most of `suite-common`: types, selectors, reducers. Not a bail, and not worth a line.
        expect(
            classify(`export const add = (a: number, b: number) => a + b;\n`, 'add.ts'),
        ).toBeNull();
    });

    it('records a deliberate file-level opt-out', () => {
        expect(classify(`'use no memo';\n\n${COMPONENT}`)).toEqual({
            file: 'fixture.tsx',
            status: 'opt-out',
            reasons: ["'use no memo'"],
        });
    });

    it('separates a file the compiler refused outright from one it refused in part', () => {
        // A ref read during render is the most common refusal in this repository (12 files).
        const REF_READ = `import { useRef } from 'react';

export const Amount = ({ items }) => {
    const ref = useRef(0);
    const total = items.length + ref.current;

    return <span>{total}</span>;
};
`;

        expect(classify(REF_READ)).toEqual({
            file: 'fixture.tsx',
            status: 'bail',
            reasons: ['Cannot access refs during render'],
        });

        // The same refusal beside a component the compiler does optimise is `partial`, not `bail`:
        // the file ships half-compiled, and the difference is what the snapshot has to preserve.
        const partial = classify(`${REF_READ}\n${COMPONENT.replace('Amount', 'Total')}`);

        expect(partial?.status).toBe('partial');
        expect(partial?.reasons).toEqual(['Cannot access refs during render']);
    });
});

describe('evaluateOptOutSnapshot', () => {
    const LINE = 'a.tsx\tbail\tCannot access refs during render';
    const OTHER = "b.tsx\topt-out\t'use no memo'";

    it('passes when the inventory matches the snapshot', () => {
        expect(evaluateOptOutSnapshot(`${LINE}\n${OTHER}\n`, `${LINE}\n${OTHER}`)).toEqual([]);
    });

    it('fails on a file that entered the set, because it now ships unoptimized', () => {
        const failures = evaluateOptOutSnapshot(`${LINE}\n`, `${LINE}\n${OTHER}`);

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('b.tsx');
        expect(failures[0]).toContain('ships unoptimized');
    });

    it('fails on a file that left the set, and says why a green gate is not evidence', () => {
        // The dangerous direction. Code nobody reviewed for the hazard classes is memoized for the
        // first time, and the trigger is usually a change elsewhere.
        const failures = evaluateOptOutSnapshot(`${LINE}\n${OTHER}\n`, LINE);

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('b.tsx');
        expect(failures[0]).toContain('is not evidence');
    });

    it('fails when the same file is refused for a different reason', () => {
        const failures = evaluateOptOutSnapshot(
            `${LINE}\n`,
            'a.tsx\tbail\tsomething else entirely',
        );

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('babel-plugin-react-compiler has most likely changed');
    });

    it('fails on an empty inventory while a wave is enabled, rather than calling it clean', () => {
        const failures = evaluateOptOutSnapshot('', '', ['suite-common']);

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('stopped being collected');
    });

    it('passes on an empty inventory once every wave is rolled back', () => {
        expect(evaluateOptOutSnapshot('', '', [])).toEqual([]);
    });
});

describe('formatOptOutSnapshot', () => {
    it('emits tab-separated rows in ASCII order, whatever order they were found in', () => {
        expect(
            formatOptOutSnapshot([
                { file: 'b.tsx', status: 'opt-out', reasons: ["'use no memo'"] },
                { file: 'a.tsx', status: 'partial', reasons: ['second', 'first'] },
            ]),
        ).toBe("a.tsx\tpartial\tsecond; first\nb.tsx\topt-out\t'use no memo'");
    });
});

describe('scanDirectories', () => {
    it('finds nothing when asked to scan nothing', () => {
        const report = scanDirectories([]);

        expect(report).toEqual({
            files: 0,
            compiled: 0,
            guards: 0,
            findings: [],
            impureCaches: [],
            frozenCaptures: [],
            suppressedFiles: [],
            optOuts: [],
            unknownGuardShapes: [],
            transformErrors: [],
        });
    });

    it('really compiles repository sources, not just fixtures', () => {
        // Only the first wave, so the cost stays flat as later waves are added; the CI gate scans
        // them all. What this pins is that `scanDirectories` still reaches real files and still gets
        // memo caches out of them — a wrong preset or a swallowed error would otherwise leave every
        // corpus scan reporting zero findings forever. Emptying the wave list is the rollback path
        // and must not fail here; `evaluateFrozenReadReport` is what refuses an enabled wave that
        // compiled nothing.
        const [firstWave] = REACT_COMPILER_PATHS;
        if (firstWave === undefined) {
            return;
        }

        const report = scanDirectories([firstWave]);

        expect(report.files).toBeGreaterThan(0);
        expect(report.compiled).toBeGreaterThan(0);
        expect(report.guards).toBeGreaterThan(0);
        expect(report.transformErrors).toEqual([]);
    });
});

describe('evaluateFrozenReadReport', () => {
    const cleanReport: FrozenReadReport = {
        files: 10,
        compiled: 4,
        guards: 20,
        findings: [],
        impureCaches: [],
        frozenCaptures: [],
        suppressedFiles: [],
        optOuts: [],
        unknownGuardShapes: [],
        transformErrors: [],
    };

    it('passes a wave with no findings', () => {
        expect(evaluateFrozenReadReport(cleanReport, ['suite-common'])).toEqual([]);
    });

    it('passes when no wave is enabled and nothing was compiled', () => {
        expect(evaluateFrozenReadReport({ ...cleanReport, files: 0, compiled: 0 }, [])).toEqual([]);
    });

    it('fails a wave whose scan compiled nothing, rather than calling it clean', () => {
        const failures = evaluateFrozenReadReport({ ...cleanReport, compiled: 0 }, [
            'suite-common',
        ]);

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('no memo cache');
    });

    it('fails on a file it could not compile, because that file went unchecked', () => {
        const failures = evaluateFrozenReadReport(
            { ...cleanReport, transformErrors: [{ file: 'a.tsx', error: 'unsupported syntax' }] },
            ['suite-common'],
        );

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('a.tsx');
    });

    it('fails on a guard shape it does not model, because the compiler has changed', () => {
        const failures = evaluateFrozenReadReport(
            { ...cleanReport, unknownGuardShapes: [{ file: 'a.tsx', line: 7 }] },
            ['suite-common'],
        );

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('a.tsx:7');
    });

    it('fails on a render-time read and says which accessor and where', () => {
        const failures = evaluateFrozenReadReport(
            {
                ...cleanReport,
                findings: [
                    {
                        file: 'Amount.tsx',
                        line: 12,
                        column: 4,
                        accessor: 'watch',
                        kind: 'render-read',
                        owner: 'Amount',
                        depCount: 1,
                    },
                ],
            },
            ['packages/suite/src/views'],
        );

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('Amount.tsx:12:4');
        expect(failures[0]).toContain('watch');
        expect(failures[0]).toContain('useWatch');
    });

    it('does not fail on the advisory suppressed-file channel', () => {
        const failures = evaluateFrozenReadReport(
            {
                ...cleanReport,
                suppressedFiles: [
                    { file: 'useSendForm.ts', caches: 0, cachesWithoutSuppressions: 1 },
                ],
            },
            ['packages/suite/src/hooks'],
        );

        expect(failures).toEqual([]);
    });

    it('fails on a frozen capture and points at the closure and the read', () => {
        const failures = evaluateFrozenReadReport(
            {
                ...cleanReport,
                frozenCaptures: [
                    {
                        file: 'ConnectionGlobalModalContext.tsx',
                        line: 109,
                        column: 38,
                        global: 'Date.now()',
                        binding: 'lastUpdatedBoundaryTimestamp',
                        readLine: 107,
                        owner: 'useConnectionGlobalModal',
                        depCount: 0,
                    },
                ],
            },
            ['packages/suite/src/components'],
        );

        expect(failures).toHaveLength(1);
        expect(failures[0]).toContain('ConnectionGlobalModalContext.tsx:109:38');
        expect(failures[0]).toContain('lastUpdatedBoundaryTimestamp');
        expect(failures[0]).toContain('ConnectionGlobalModalContext.tsx:107');
        expect(failures[0]).toContain('built once on the first render');
    });

    it('does not fail on the advisory impure-cache channel', () => {
        const failures = evaluateFrozenReadReport(
            {
                ...cleanReport,
                impureCaches: [
                    {
                        file: 'Timerange.tsx',
                        line: 609,
                        column: 18,
                        global: 'new Date()',
                        owner: 'Timerange',
                    },
                ],
            },
            ['packages/components/src'],
        );

        expect(failures).toEqual([]);
    });
});
