// TODO: add BigInt breaking note to commit message and change log in protocol package
// TypeScript implementation of elligator2 https://www.rfc-editor.org/rfc/rfc9380.html#ell2-opt

let constants: ReturnType<typeof getConstants> | undefined;

const getConstants = (): {
    p: bigint;
    J: bigint;
    c3: bigint;
    c4: bigint;
    a24: bigint;
} => {
    if (constants) {
        return constants;
    }

    if (typeof BigInt === 'undefined') {
        throw new Error('curve25519: BigInt not supported');
    }

    const p = 2n ** 255n - 19n;
    const J = 486662n;

    const c3 = BigInt(
        '19681161376707505956807079304988542015446066515923890162744021073123829784752',
    ); // sqrt(-1)

    const c4 = (p - 5n) / 8n;
    const a24 = (J + 2n) / 4n;

    const ctx = {
        p,
        J,
        c3,
        c4,
        a24,
    };

    constants = ctx;

    return ctx;
};

// python int.from_bytes(array, "little")
function littleEndianBytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
        result += BigInt(bytes[i]) << (8n * BigInt(i));
    }

    return result;
}

// python int.to_bytes(32, "little")
function bigintToLittleEndianBytes(value: bigint, length: number = 32): Uint8Array {
    let byteArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        byteArray[i] = Number(value & 0xffn);
        value >>= 8n;
    }

    return byteArray;
}

// python pow(a, b, c)
function pow(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n;
    base = base % mod;
    while (exp > 0) {
        if (exp % 2n === 1n) {
            result = (result * base) % mod;
        }
        exp = exp >> 1n;
        base = (base * base) % mod;
    }

    return result;
}

// decodeScalar25519 from
// https://datatracker.ietf.org/doc/html/rfc7748#section-5
function decodeScalar(scalar: Uint8Array): bigint {
    if (scalar.length !== 32) {
        throw new Error('Invalid length of scalar');
    }

    let array = new Uint8Array(scalar);
    array[0] &= 248;
    array[31] &= 127;
    array[31] |= 64;

    return littleEndianBytesToBigInt(array);
}

// decodeUCoordinate from
// https://datatracker.ietf.org/doc/html/rfc7748#section-5
function decodeCoordinate(coordinate: Uint8Array): bigint {
    if (coordinate.length !== 32) {
        throw new Error('Invalid length of coordinate');
    }

    let array = new Uint8Array(coordinate);
    array[array.length - 1] &= 0x7f;

    return littleEndianBytesToBigInt(array);
}

// encodeUCoordinate from
// https://datatracker.ietf.org/doc/html/rfc7748#section-5
function encodeCoordinate(coordinate: bigint): Uint8Array {
    return bigintToLittleEndianBytes(coordinate);
}

// Returns (second, first) if condition is true and (first, second) otherwise
// Must be implemented in a way that it is constant time
function conditionalSwap(a: bigint, b: bigint, condition: boolean): [bigint, bigint] {
    const mask = condition ? -1n : 0n;
    const newA = (a & ~mask) | (b & mask);
    const newB = (a & mask) | (b & ~mask);

    return [newA, newB];
}

// https://hyperelliptic.org/EFD/g1p/auto-montgom-xz.html#ladder-ladd-1987-m-3
// (x4, z4) = 2 * (x2, z2)
// (x5, z5) = (x2, z2) + (x3, z3)
// where (x1, 1) = (x3, z3) - (x2, z2)
function ladderOperation(
    { p, a24 }: ReturnType<typeof getConstants>,
    x1: bigint,
    x2: bigint,
    z2: bigint,
    x3: bigint,
    z3: bigint,
): [bigint, bigint, bigint, bigint] {
    const a = (x2 + z2) % p;
    const aa = (a * a) % p;
    const b = (x2 - z2 + p) % p;
    const bb = (b * b) % p;
    const e = (aa - bb + p) % p;
    const c = (x3 + z3) % p;
    const d = (x3 - z3 + p) % p;
    const da = (d * a) % p;
    const cb = (c * b) % p;
    const t0 = (da + cb) % p;
    const x5 = (t0 * t0) % p;
    const t1 = (da - cb + p) % p;
    const t2 = (t1 * t1) % p;
    const z5 = (x1 * t2) % p;
    const x4 = (aa * bb) % p;
    const t3 = (a24 * e) % p;
    const t4 = (bb + t3) % p;
    const z4 = (e * t4) % p;

    return [x4, z4, x5, z5];
}

// X25519 from
// https://datatracker.ietf.org/doc/html/rfc7748#section-5
export function curve25519(privateKey: Uint8Array, publicKey: Uint8Array): Buffer {
    const ctx = getConstants();
    const { p } = ctx;
    const k = decodeScalar(privateKey);
    const u = decodeCoordinate(publicKey) % p;

    let x1 = u;
    let x2 = 1n;
    let z2 = 0n;
    let x3 = u;
    let z3 = 1n;
    let swap = 0;

    for (let i = 255; i >= 0; i--) {
        const bit = Number((k >> BigInt(i)) & 1n);
        swap ^= bit;
        [x2, x3] = conditionalSwap(x2, x3, Boolean(swap));
        [z2, z3] = conditionalSwap(z2, z3, Boolean(swap));
        swap = bit;
        [x2, z2, x3, z3] = ladderOperation(ctx, x1, x2, z2, x3, z3);
    }

    [x2, x3] = conditionalSwap(x2, x3, Boolean(swap));
    [z2, z3] = conditionalSwap(z2, z3, Boolean(swap));

    const x = (pow(z2, p - 2n, p) * x2) % p;

    return Buffer.from(encodeCoordinate(x));
}

// Returns second if condition is true and first otherwise
// Must be implemented in a way that it is constant time
function conditionalMove(first: bigint, second: bigint, condition: boolean): bigint {
    const trueMask = condition ? -1n : 0n;
    const falseMask = ~trueMask;

    return (first & falseMask) | (second & trueMask);
}

// map_to_curve_elligator2_curve25519 from
// https://www.rfc-editor.org/rfc/rfc9380.html#ell2-opt
export function elligator2(point: Uint8Array): Uint8Array {
    const ctx = getConstants();
    const { p, J, c4, c3 } = ctx;

    const u = decodeCoordinate(point) % p;

    let tv1 = (u * u) % p;
    tv1 = (2n * tv1) % p;
    const xd = (tv1 + 1n) % p;
    const x1n = (-J + p) % p;
    let tv2 = (xd * xd) % p;
    const gxd = (tv2 * xd) % p;
    let gx1 = (J * tv1) % p;
    gx1 = (gx1 * x1n) % p;
    gx1 = (gx1 + tv2) % p;
    gx1 = (gx1 * x1n) % p;

    let tv3 = (gxd * gxd) % p;
    tv2 = (tv3 * tv3) % p;
    tv3 = (tv3 * gxd) % p;
    tv3 = (tv3 * gx1) % p;
    tv2 = (tv2 * tv3) % p;

    let y11 = pow(tv2, c4, p);
    y11 = (y11 * tv3) % p;
    const y12 = (y11 * c3) % p;
    tv2 = (y11 * y11) % p;
    tv2 = (tv2 * gxd) % p;

    const e1 = tv2 == gx1;
    const y1 = conditionalMove(y12, y11, e1);
    const x2n = (x1n * tv1) % p;

    tv2 = (y1 * y1) % p;
    tv2 = (tv2 * gxd) % p;
    const e3 = tv2 == gx1;
    const xn = conditionalMove(x2n, x1n, e3);
    const x = (xn * pow(xd, p - 2n, p)) % p;

    return encodeCoordinate(x);
}

// https://cr.yp.to/ecdh.html
// Computing secret keys
export const getCurve25519KeyPair = (randomPriv: Buffer) => {
    randomPriv[0] &= 248;
    randomPriv[31] &= 127;
    randomPriv[31] |= 64;

    const basepoint = Buffer.alloc(32).fill(0);
    basepoint[0] = 0x09;

    return {
        publicKey: curve25519(randomPriv, basepoint),
        privateKey: randomPriv,
    };
};
