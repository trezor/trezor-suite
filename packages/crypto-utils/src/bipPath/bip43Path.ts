type PathIndex = number | 'i';
type MaybeApostrophe = `'` | '';
type HardenedLevel<TIndex extends PathIndex> = `/${TIndex}'`;
type MaybeLevel<TIndex extends PathIndex> = `/${TIndex}${MaybeApostrophe}` | '';

// The generic keeps template and resolved paths structurally aligned while excluding `i` from
// resolved paths.
type Bip43PathWithIndex<TIndex extends PathIndex> =
    `m${HardenedLevel<number>}${HardenedLevel<number>}${HardenedLevel<TIndex>}${MaybeLevel<TIndex>}${MaybeLevel<TIndex>}`;

// Template with i in place of an account index, which shall be substituted with a number.
export type Bip43PathTemplate = Bip43PathWithIndex<PathIndex>;
export type Bip43Path = Bip43PathWithIndex<number>;
