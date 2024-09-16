export const buildURL = (method: string, params: any, callback: string) => {
    return `trezorsuitelite://connect?method=${method}&params=${encodeURIComponent(
        JSON.stringify(params),
    )}&callback=${encodeURIComponent(callback)}`;
};
