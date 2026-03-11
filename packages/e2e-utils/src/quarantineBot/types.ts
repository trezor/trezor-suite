export type {
    Action,
    ActionsListResponse,
    TestExplorerItem,
    TestExplorerMetrics,
    TestResultCommit,
    TestResultItem,
    TestResultsResponse,
    TestsExplorerResponse,
    RuleMatcherCondition,
    RuleMatcher,
    RuleAction,
} from '../currentsApi/types';

export type SlackEvent =
    | {
          kind: 'quarantined';
          projectId: string;
          titlePath: string[];
          signature: string;
          actionId: string;
          failures: number;
          executions: number;
      }
    | {
          kind: 'unquarantined';
          projectId: string;
          titlePath: string[];
          signature: string;
          passes: number;
          executions: number;
      };
