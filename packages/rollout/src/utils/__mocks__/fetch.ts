export const fetchFirmware = jest.fn().mockImplementation(() => {
    return Promise.resolve(new ArrayBuffer(512));
});
