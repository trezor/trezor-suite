export const capitalizeFirstLetter = <T extends string = string>(str: T): Capitalize<T> =>
    (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
