declare const filterSafeListByBootloader: ({ releasesList, bootloaderVersion }: {
    releasesList: any;
    bootloaderVersion: any;
}) => any;
declare const filterSafeListByFirmware: ({ releasesList, firmwareVersion }: {
    releasesList: any;
    firmwareVersion: any;
}) => any;
export { filterSafeListByBootloader, filterSafeListByFirmware };
