export type DiscoveryStatusType =
    | {
          status: 'loading';
          type: 'waiting-for-device' | 'auth' | 'discovery';
      }
    | {
          status: 'exception';
          type: 'discovery-empty' | 'discovery-failed' | 'device-unavailable';
      };

export type AccountItemType = 'coin' | 'tokens' | 'staking';
