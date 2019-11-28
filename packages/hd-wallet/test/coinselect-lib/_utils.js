function addScriptLength(values, scriptLength) {
    return values.map((xx) => {
        const x = xx;
        if (x.script === undefined) {
            x.script = { length: scriptLength };
        }
        return x;
    });
}

export function addScriptLengthToExpected(expected, inputLength, outputLength) {
    const newExpected = Object.assign({}, expected);

    if (expected.inputs != null) {
        newExpected.inputs = expected.inputs.map((input) => {
            const newInput = Object.assign({}, input);
            if (newInput.script == null) {
                newInput.script = { length: inputLength };
            }
            return newInput;
        });
    }

    if (expected.outputs != null) {
        newExpected.outputs = expected.outputs.map((output) => {
            const newOutput = Object.assign({}, output);
            if (newOutput.script == null) {
                newOutput.script = { length: outputLength };
            }
            return newOutput;
        });
    }

    return newExpected;
}

export function expand(values, indices, scriptLength) {
    if (indices) {
        return addScriptLength(values.map((x, i) => {
            if (typeof x === 'number') return { i, value: x };

            const y = { i };
            Object.keys(x).forEach((k) => { y[k] = x[k]; });
            return y;
        }), scriptLength);
    }

    return addScriptLength(values.map(x => (typeof x === 'object' ? x : { value: x })), scriptLength);
}

export function testValues(t, actual, expected) {
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
