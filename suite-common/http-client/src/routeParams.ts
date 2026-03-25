type SplitString<S extends string, D extends string> = string extends S
    ? string[]
    : S extends ''
      ? []
      : S extends `${infer T}${D}${infer U}`
        ? [T, ...SplitString<U, D>]
        : [S];

type Variables<S extends string> = SplitString<S, '/'>[number] extends `${infer V}`
    ? V extends `:${infer T}`
        ? T
        : never
    : never;

export type GenerateRouteParams<
    S extends string,
    V extends Variables<S> = Variables<S>,
> = V extends string ? { [key in V]: string } : never;

export function composePathnameFromRoute(
    routePathname: string,
    pathnameParams: Record<string, string>,
) {
    return routePathname
        .split('/')
        .map(segment => {
            if (!segment.startsWith(':')) {
                return segment;
            }

            const paramName = segment.slice(1);

            if (!pathnameParams[paramName]) {
                throw new Error(`Param ${paramName} is missing in the pathname params`);
            }

            return encodeURIComponent(pathnameParams[paramName]);
        })
        .join('/');
}
