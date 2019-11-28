/* @flow */

// Helper class for permutation
export class Permutation<X> {
    sorted: Array<X> = [];

    // Permutation is an array,
    // where on Ith position is J, which means that Jth element in the original, unsorted
    // output array
    // is Ith in the new array.
    _permutation: Array<number>;

    constructor(sorted: Array<X>, permutation: Array<number>) {
        this.sorted = sorted;
        this._permutation = permutation;
    }

    static fromFunction<Y>(original: Array<Y>, sort: ((a: Y, b: Y) => number)): Permutation<Y> {
        const range = [...original.keys()];

        // I am "sorting range" - (0,1,2,3,...)
        // so I got the indexes and not the actual values inside
        const permutation = range.sort((a, b) => sort(original[a], original[b]));
        const res = new Permutation([], permutation);

        res.forEach((originalIx, newIx) => {
            res.sorted[newIx] = original[originalIx];
        });
        return res;
    }

    forEach(f: (originalIx: number, sortedIx: number) => void) {
        this._permutation.forEach(f);
    }

    map<Y>(fun: (p: X) => Y): Permutation<Y> {
        const original: Array<Y> = this.sorted.map(fun);
        const perm: Array<number> = this._permutation;
        const res: Permutation<Y> = new Permutation(original, perm);
        return res;
    }
}
