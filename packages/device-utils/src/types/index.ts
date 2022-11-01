// define required device attributes here to avoid dependencies
// can be replaced in the future when we create a device types package
export type PartialDevice = Partial<{
    features: {
        bootloader_mode: boolean | null;
        bootloader_hash: string | null;
        revision: string | null;
        major_version: number | null;
        minor_version: number | null;
        patch_version: number | null;
        fw_major: number | null;
        fw_minor: number | null;
        fw_patch: number | null;
        initialized: boolean | null;
        no_backup: boolean | null;
    };
    firmwareType: string | null;
}>;
