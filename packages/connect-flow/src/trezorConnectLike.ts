export type ButtonRequestData =
    | {
          type: 'address';
          serializedPath: string;
          address: string;
      }
    | {
          type: 'message';
          message: string;
      };

export type UiEvent =
    | {
          type: 'ui-request_passphrase';
          payload: { device: { path: string } };
          requestId?: string;
          callId?: string;
      }
    | {
          type: 'ui-request_passphrase_on_device';
          payload: { device: { path: string } };
          requestId?: string;
          callId?: string;
      }
    | {
          type: 'ui-request_pin';
          payload: { device: { path: string }; type: string };
          requestId?: string;
          callId?: string;
      }
    | {
          type: 'ui-button';
          payload: {
              device: { path: string };
              code: string;
              data?: ButtonRequestData;
          };
          requestId?: string;
          callId?: string;
      }
    | {
          type: 'ui-request_confirmation';
          payload: { view: string; label?: string };
          requestId?: string;
          callId?: string;
      };

export type UiResponse =
    | {
          type: 'ui-receive_passphrase';
          payload: { value: string; save: boolean; passphraseOnDevice: boolean };
          requestId?: string;
      }
    | { type: 'ui-receive_pin'; payload: { value: string }; requestId?: string }
    | { type: 'ui-receive_confirmation'; payload: boolean; requestId?: string };

export type ConnectResult<T> =
    | { success: true; payload: T }
    | { success: false; payload: { error: string; code?: string } };

export type UiEventListener = (event: UiEvent) => void;

export interface GetDeviceStateParams {
    device: { path: string };
    useEmptyPassphrase?: boolean;
    callId?: string;
}

export interface GetAddressParams {
    device?: { path: string };
    path: string | number[];
    coin?: string;
    showOnTrezor?: boolean;
    callId?: string;
}

export interface GetAddressResult {
    address: string;
    path: number[];
    serializedPath: string;
}

export interface TrezorConnectLike {
    on(event: 'UI_EVENT', listener: UiEventListener): void;
    off(event: 'UI_EVENT', listener: UiEventListener): void;
    uiResponse(response: UiResponse): void;
    cancel(message?: string): void;
    getDeviceState(params: GetDeviceStateParams): Promise<ConnectResult<{ state: string }>>;
    getAddress(params: GetAddressParams): Promise<ConnectResult<GetAddressResult>>;
}
