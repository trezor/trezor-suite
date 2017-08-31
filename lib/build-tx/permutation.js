/* @flow */

// Helper class for permutation
export class Permutation<X> {
    sorted: Array<X> = [];

    // Permutation is an array,
    // where on Ith position is J, which means that Jth element in the original, unsorted
    // output array
    // is Ith in the new array.
    _permutation: Array<number>;

    constructor(original: Array<X>, sort: ((a: X, b: X) => number) | Array<number>) {
        // I am "sorting range" - (0,1,2,3,...)
        // so I got the indexes and not the actual values inside
        if (typeof sort === 'object' && sort instanceof Array) {
            this.sorted = original;
            this._permutation = sort;
        } else {
            const sortFun: ((a: X, b: X) => number) = sort;
            const range = [...original.keys()];
            const permutation = range.sort((a, b) => sortFun(original[a], original[b]));
            this._permutation = permutation;

            this.forEach((originalIx, newIx) => {
                this.sorted[newIx] = original[originalIx];
            });
        }
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
