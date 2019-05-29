export const INIT = '@suite/init';
export const READY = '@suite/ready';
export const ERROR = '@suite/error';

export type SuiteActions =
    | {
          type: typeof INIT;
      }
    | {
          type: typeof READY;
      }
    | {
          type: typeof ERROR;
          error: any;
      };

export const onSuiteReady = (): SuiteActions => {
    return {
        type: READY,
    };
};

export const onSuiteError = (error: any): SuiteActions => {
    return {
        type: ERROR,
        error,
    };
};
