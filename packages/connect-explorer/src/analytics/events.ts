export enum AnalyticsEventType {
    PageView = 'page/view',
    MethodTesterCall = 'method-tester/call',
    MethodTesterResponse = 'method-tester/response',
}

export type ConnectExplorerAnalyticsEvent =
    | {
          type: AnalyticsEventType.PageView;
          payload: {
              path: string;
              referrer?: string;
          };
      }
    | {
          type: AnalyticsEventType.MethodTesterCall;
          payload: {
              method: string;
          };
      }
    | {
          type: AnalyticsEventType.MethodTesterResponse;
          payload: {
              method: string;
              response: string;
          };
      };
