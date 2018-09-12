/* @flow */

declare module 'bignumber.js' {
    declare type $npm$big$number$object = number | string | T_BigNumber
    declare type $npm$cmp$result = -1 | 0 | 1
    declare type DIGIT = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    declare type ROUND_DOWN = 0
    declare type ROUND_HALF_UP = 1
    declare type ROUND_HALF_EVEN = 2
    declare type ROUND_UP = 3
    declare type RM = ROUND_DOWN | ROUND_HALF_UP | ROUND_HALF_EVEN | ROUND_UP

    declare class T_BigNumber {
      // Properties
      static DP: number;
      static RM: RM;
      static E_NEG: number;
      static E_POS: number;

      c: Array<DIGIT>;
      e: number;
      s: -1 | 1;

      // Constructors
      static (value: $npm$big$number$object): T_BigNumber;
      constructor(value: $npm$big$number$object): T_BigNumber;

      // Methods
      abs(): T_BigNumber;
      cmp(n: $npm$big$number$object): $npm$cmp$result;
      div(n: $npm$big$number$object): T_BigNumber;
      dividedBy(n: $npm$big$number$object): T_BigNumber;
      eq(n: $npm$big$number$object): boolean;
      gt(n: $npm$big$number$object): boolean;
      greaterThan(n: $npm$big$number$object): boolean;
      gte(n: $npm$big$number$object): boolean;
      lt(n: $npm$big$number$object): boolean;
      lessThan(n: $npm$big$number$object): boolean;
      lte(n: $npm$big$number$object): boolean;
      lessThanOrEqualTo(n: $npm$big$number$object): boolean;
      minus(n: $npm$big$number$object): T_BigNumber;
      mod(n: $npm$big$number$object): T_BigNumber;
      plus(n: $npm$big$number$object): T_BigNumber;
      pow(exp: number): BigNumber;
      round(dp: ?number, rm: ?RM): T_BigNumber;
      sqrt(): T_BigNumber;
      times(n: $npm$big$number$object): T_BigNumber;
      toExponential(dp: ?number): string;
      toFixed(dp: ?number): string;
      toPrecision(sd: ?number): string;
      toString(format?: number): string;
      toNumber(): number;
      valueOf(): string;
      toJSON(): string;
    }

    //declare module.exports: typeof T_BigNumber
    declare export default typeof T_BigNumber;
}