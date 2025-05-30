import { EventType } from './constants';

export type SuiteSharedAnalyticsEvent =
    | {
          type: EventType.WalletConnectInit;
      }
    | {
          type: EventType.WalletConnectPaired;
      }
    | {
          type: EventType.WalletConnectSessionRequest;
          payload: {
              origin: string;
              chainId: string;
              method: string;
          };
      }
    | {
          type: EventType.WalletConnectProposal;
          payload: {
              origin: string;
              validation: 'UNKNOWN' | 'VALID' | 'INVALID';
              networks: string[];
          };
      }
    | {
          type: EventType.WalletConnectProposalApproved;
          payload: {
              origin?: string;
          };
      }
    | {
          type: EventType.WalletConnectProposalRejected;
          payload: {
              origin?: string;
          };
      }
    | {
          type: EventType.WalletConnectError;
          payload: {
              error: string;
          };
      }
    | {
          type: EventType.ConnectPopupInit;
      }
    | {
          type: EventType.ConnectPopupPermissions;
          payload: {
              origin: string;
              method: string;
              approved: boolean;
          };
      }
    | {
          type: EventType.ConnectPopupCall;
          payload: {
              origin: string;
              method: string;
          };
      }
    | {
          type: EventType.ConnectPopupError;
          payload: {
              origin: string;
              method: string;
              error: string;
          };
      };
