import BN from 'bn.js';
import { INPUT_SCRIPT_LENGTH, OUTPUT_SCRIPT_LENGTH } from '../../src/coinselect/coinselectUtils';

function addScriptLength(values: any[], scriptLength: number) {
    return values.map(xx => {
        const x = xx;
        if (x.script === undefined) {
            x.script = { length: scriptLength };
        }
        return x;
    });
}

function valueToBN(vinVout: VinVoutFixture) {
    if (typeof vinVout === 'string') return { value: new BN(vinVout) };
    if (vinVout.value) {
        return { ...vinVout, value: new BN(vinVout.value) };
    }
    return vinVout;
}

function valueToString(vinVout: VinVoutResult) {
    if (vinVout.value) {
        return { ...vinVout, value: vinVout.value.toString() };
    }
    return vinVout;
}

export function addScriptLengthToExpected(expected: { inputs?: any[]; outputs?: any[] }) {
    const newExpected = { ...expected };

    if (expected.inputs != null) {
        newExpected.inputs = expected.inputs.map(input => {
            const newInput = { ...input, type: 'p2pkh' };
            if (newInput.script == null) {
                newInput.script = { length: INPUT_SCRIPT_LENGTH.p2pkh };
            }
            return newInput;
        });
    }

    if (expected.outputs != null) {
        newExpected.outputs = expected.outputs.map(output => {
            const newOutput = { ...output };
            if (newOutput.script == null) {
                newOutput.script = { length: OUTPUT_SCRIPT_LENGTH.p2pkh };
            }
            return newOutput;
        });
    }

    return newExpected;
}

type VinVoutFixture = string | { value?: string };

export function expand(values: VinVoutFixture[], indices: boolean) {
    if (indices) {
        return addScriptLength(
            values.map((x, i) => ({
                i,
                type: 'p2pkh',
                ...valueToBN(x),
            })),
            INPUT_SCRIPT_LENGTH.p2pkh,
        );
    }

    return addScriptLength(values.map(valueToBN), OUTPUT_SCRIPT_LENGTH.p2pkh);
}

type VinVoutResult = { value: BN };

export function serialize(result: { inputs?: VinVoutResult[]; outputs?: VinVoutResult[] }) {
    return {
        ...result,
        inputs: result.inputs?.map(valueToString),
        outputs: result.outputs?.map(valueToString),
    };
}
