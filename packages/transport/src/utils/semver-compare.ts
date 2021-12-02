// copied from semver-compare package
// https://www.npmjs.com/package/semver-compare
// LICENSE: https://github.com/substack/semver-compare/blob/master/LICENSE

export const semverCompare = (a: string, b: string) => {
    const pa = a.split('.');
    const pb = b.split('.');
    for (let i = 0; i < 3; i++) {
        const na = Number(pa[i]);
        const nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!Number.isNaN(na) && Number.isNaN(nb)) return 1;
        if (Number.isNaN(na) && !Number.isNaN(nb)) return -1;
    }
    return 0;
};
