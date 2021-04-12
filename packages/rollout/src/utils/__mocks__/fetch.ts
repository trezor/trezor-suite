export const fetchFirmware = jest
    .fn()
    .mockImplementation(() => Promise.resolve(new ArrayBuffer(512)));
