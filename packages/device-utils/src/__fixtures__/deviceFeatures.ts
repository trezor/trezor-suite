import type { MessagesSchema as PROTO } from '@trezor/protobuf';

export const T1B1Features = {
    bootloader_mode: false,
    major_version: 1,
    minor_version: 13,
    patch_version: 1,
} as PROTO.Features;
export const T1B1FeaturesBL = {
    bootloader_mode: true,
    fw_major: 1,
    fw_minor: 13,
    fw_patch: 1,
    major_version: 1,
    minor_version: 12,
    patch_version: 1,
} as PROTO.Features;
export const T2T1Features = {
    bootloader_mode: false,
    major_version: 2,
    minor_version: 9,
    patch_version: 4,
} as PROTO.Features;
export const T2T1FeaturesBL = {
    bootloader_mode: true,
    fw_major: 2,
    fw_minor: 9,
    fw_patch: 4,
    major_version: 2,
    minor_version: 1,
    patch_version: 8,
} as PROTO.Features;
