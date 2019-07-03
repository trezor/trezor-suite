declare const _default: {
    isEqual: (versionX: number[], versionY: number[]) => boolean;
    isNewer: (versionX: number[], versionY: number[]) => boolean;
    isNewerOrEqual: (versionX: any, versionY: any) => boolean;
    parse: (versionArr: number[]) => {
        major: number;
        minor: number;
        patch: number;
    };
    toString: (arr: number[]) => string;
};
export default _default;
