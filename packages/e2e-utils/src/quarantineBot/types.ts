export type SlackEvent =
    | {
          kind: 'quarantined';
          projectId: string;
          titlePath: string[];
          signature: string | undefined;
          actionId: string;
          failures: number;
          executions: number;
      }
    | {
          kind: 'unquarantined';
          projectId: string;
          titlePath: string[];
          signature: string | undefined;
          passes: number;
          executions: number;
      };

export interface FailedTestFromRun {
    titlePath: string[];
    spec: string;
}
