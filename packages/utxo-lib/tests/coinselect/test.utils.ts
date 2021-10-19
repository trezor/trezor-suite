function addScriptLength(values: any[], scriptLength: number) {
    return values.map(xx => {
        const x = xx;
        if (x.script === undefined) {
            x.script = { length: scriptLength };
        }
        return x;
    });
}

export function addScriptLengthToExpected(
    expected: { inputs?: any[]; outputs?: any[] },
    inputLength: number,
    outputLength: number,
) {
    const newExpected = { ...expected };

    if (expected.inputs != null) {
        newExpected.inputs = expected.inputs.map(input => {
            const newInput = { ...input };
            if (newInput.script == null) {
                newInput.script = { length: inputLength };
            }
            return newInput;
        });
    }

    if (expected.outputs != null) {
        newExpected.outputs = expected.outputs.map(output => {
            const newOutput = { ...output };
            if (newOutput.script == null) {
                newOutput.script = { length: outputLength };
            }
            return newOutput;
        });
    }

    return newExpected;
}

type F = string | { value?: string };

export function expand(values: F[], indices: boolean, scriptLength: number) {
    if (indices) {
        return addScriptLength(
            values.map((x, i) => {
                if (typeof x === 'string') return { i, value: x };

                const y = Object.assign({ i }, x);
                return y;
            }),
            scriptLength,
        );
    }

    return addScriptLength(
        values.map(x => (typeof x === 'object' ? x : { value: x })),
        scriptLength,
    );
}

export function testValues(t: any, actual: any[], expected: any[]) {
    t.equal(typeof actual, typeof expected, 'types match');
    if (!expected) return;

    t.equal(actual.length, expected.length, 'lengths match');

    actual.forEach((ai, i) => {
        const ei = expected[i];

        if (ai.i !== undefined) {
            t.equal(ai.i, ei, 'indexes match');
        } else if (typeof ei === 'number') {
            t.equal(ai.value, ei, 'values match');
        } else {
            t.same(ai, ei, 'objects match');
        }
    });
}
