export type UiEvent =
    | { type: 'ui-request_passphrase'; payload: { device: { path: string } }; requestId?: string }
    | {
          type: 'ui-request_passphrase_on_device';
          payload: { device: { path: string } };
          requestId?: string;
      }
    | {
          type: 'ui-request_pin';
          payload: { device: { path: string }; type: string };
          requestId?: string;
      }
    | {
          type: 'ui-request_button';
          payload: { device: { path: string }; code: string };
          requestId?: string;
      };

export type UiResponse =
    | {
          type: 'ui-receive_passphrase';
          payload: { value: string; save: boolean; passphraseOnDevice: boolean };
          requestId?: string;
      }
    | { type: 'ui-receive_pin'; payload: { value: string }; requestId?: string };

export type ConnectResult<T> =
    | { success: true; payload: T }
    | { success: false; payload: { error: string; code?: string } };

export type UiEventListener = (event: UiEvent) => void;

export interface TrezorConnectLike {
    on(event: 'UI_EVENT', listener: UiEventListener): void;
    off(event: 'UI_EVENT', listener: UiEventListener): void;
    uiResponse(response: UiResponse): void;
    getDeviceState(params: {
        device: { path: string };
        useEmptyPassphrase?: boolean;
    }): Promise<ConnectResult<{ state: string }>>;
}
