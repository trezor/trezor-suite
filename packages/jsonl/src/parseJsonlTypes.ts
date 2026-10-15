export type ParseJsonlError =
    | {
          type: 'JsonlInvalidJson';
          lineNumber: number;
          message: string;
      }
    | {
          type: 'JsonlRecordIsNotObject';
          lineNumber: number;
      }
    | {
          type: 'JsonlRecordDoesNotMatchSchema';
          lineNumber: number;
          message: string;
      };
