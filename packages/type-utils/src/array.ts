/**
 * Gets the type of the elements in an array.
 *
 * Example:
 *  ```
 *  type A = (number | string)[];
 *  type E = ArrayElement<A>; // number | string
 *  ```
 */
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number];
