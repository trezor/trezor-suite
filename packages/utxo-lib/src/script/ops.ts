import * as ops from 'bitcoin-ops';

// extend with Decred OP codes
const OPS: Record<string, number> = {
    ...ops,
    OP_SSTX: 0xba,
    OP_SSTXCHANGE: 0xbd,
    OP_SSGEN: 0xbb,
    OP_SSRTX: 0xbc,
};

const REVERSE_OPS: string[] = [];
Object.keys(OPS).forEach(code => {
    REVERSE_OPS[OPS[code]] = code;
});

export { OPS, REVERSE_OPS };
