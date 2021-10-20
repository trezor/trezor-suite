// Helper class for permutation
export class Permutation<X> {
    sorted: X[];

    // Permutation is an array,
    // where on Ith position is J, which means that Jth element in the original, unsorted
    // output array
    // is Ith in the new array.
    permutation: number[];

    constructor(sorted: X[], permutation: number[]) {
        this.sorted = sorted;
        this.permutation = permutation;
    }

    static fromFunction<Y>(original: Y[], sort: (a: Y, b: Y) => number): Permutation<Y> {
        const range = original.map((_v, i) => i);

        // I am "sorting range" - (0,1,2,3,...)
        // so I got the indexes and not the actual values inside
        const permutation = range.sort((a, b) => sort(original[a], original[b]));
        const res = new Permutation<Y>([], permutation);

        res.forEach((originalIx, newIx) => {
            res.sorted[newIx] = original[originalIx];
        });
        return res;
    }

    forEach(fn: (originalIx: number, sortedIx: number) => void) {
        this.permutation.forEach(fn);
    }

    map<Y>(fn: (p: X) => Y): Permutation<Y> {
        const original = this.sorted.map(fn);
        const res: Permutation<Y> = new Permutation(original, this.permutation);
        return res;
    }
}
