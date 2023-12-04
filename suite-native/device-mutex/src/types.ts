type DeviceAccessResponseBody<TDeviceCallbackResponse> =
    | { success: false; error: string }
    | {
          success: true;
          payload: TDeviceCallbackResponse;
      };

export type DeviceAccessResponse<TDeviceCallbackResponse> = Promise<
    DeviceAccessResponseBody<Awaited<TDeviceCallbackResponse>>
>;
