import { parseSync, types as t } from '@babel/core';

import { REACT_COMPILER_PATHS } from './reactCompiler';
import {
    type FrozenReadFinding,
    type FrozenReadReport,
    analyseCompiledModule,
    compileForAnalysis,
    evaluateFrozenReadReport,
    findSuppressedFile,
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

describe('scanDirectories', () => {
    it('finds nothing when asked to scan nothing', () => {
        const report = scanDirectories([]);

        expect(report).toEqual({
            files: 0,
            compiled: 0,
            guards: 0,
            findings: [],
            impureCaches: [],
            suppressedFiles: [],
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
        suppressedFiles: [],
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
