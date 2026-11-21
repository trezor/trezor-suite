import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { versionUtils } from '@trezor/utils';

import type { AccountType } from '../bitcoin/accountType';

export type FirmwareVersion = [number, number, number];

/** Oldest firmware the migration was researched for. Anything older is refused. */
export const MIN_SUPPORTED_FIRMWARE: FirmwareVersion = [1, 3, 6];

/** Last firmware that talks HID. Newer firmware uses WebUSB and is handled by Trezor Suite. */
export const MAX_SUPPORTED_FIRMWARE: FirmwareVersion = [1, 6, 3];

// Firmware 1.5.0 rewrote the output handling: older versions only accept a P2SH address when
// the output is explicitly typed PAYTOSCRIPTHASH, newer ones detect the type from the address.
const FIRST_FIRMWARE_DETECTING_OUTPUT_TYPE: FirmwareVersion = [1, 5, 0];

// Firmware 1.5.1 enabled SegWit for Bitcoin, which brought BIP49 accounts, the storage wipe
// after 16 wrong PIN attempts, and the unverified SegWit input amounts (CVE-2020-14199).
const FIRST_FIRMWARE_WITH_BITCOIN_SEGWIT: FirmwareVersion = [1, 5, 1];

// Firmware 1.6.0 added native SegWit: BIP84 accounts and bech32 destination addresses.
const FIRST_FIRMWARE_WITH_BECH32: FirmwareVersion = [1, 6, 0];

// Firmware 1.6.1 switched the address confirmation screen to a fixed-width font.
const FIRST_FIRMWARE_WITH_FIXED_WIDTH_ADDRESS: FirmwareVersion = [1, 6, 1];

/**
 * Firmware 1.4.0 added Ethereum signing, but only 1.4.2 added the EIP-155 replay protection
 * (`chain_id`). Nodes reject transactions without it today, so older firmware gets no Ethereum.
 */
export const MIN_ETHEREUM_FIRMWARE: FirmwareVersion = [1, 4, 2];

// Firmware 1.5.1 started showing the Ethereum destination EIP-55 checksummed with its `0x`
// prefix. Firmware 1.4.2 and 1.5.0 show it as lowercase hex without the prefix.
const FIRST_FIRMWARE_WITH_CHECKSUMMED_ETHEREUM_ADDRESS: FirmwareVersion = [1, 5, 1];

export const isSupportedFirmware = (version: FirmwareVersion) =>
    versionUtils.isWithinRange(version, MIN_SUPPORTED_FIRMWARE, MAX_SUPPORTED_FIRMWARE);

/** Account types the firmware can sign for, in the order they are discovered. */
export const getDiscoverableAccountTypes = (version: FirmwareVersion): AccountType[] => {
    const accountTypes: AccountType[] = ['p2pkh'];

    if (versionUtils.isNewerOrEqual(version, FIRST_FIRMWARE_WITH_BITCOIN_SEGWIT)) {
        accountTypes.push('p2sh');
    }

    if (versionUtils.isNewerOrEqual(version, FIRST_FIRMWARE_WITH_BECH32)) {
        accountTypes.push('p2wpkh');
    }

    return accountTypes;
};

/** Address encodings a destination can use. Bech32m (Taproot) is listed to be rejected. */
export type DestinationFormat = 'p2pkh' | 'p2sh' | 'bech32' | 'bech32m';

export const isDestinationFormatSupported = (
    version: FirmwareVersion,
    format: DestinationFormat,
): boolean => {
    switch (format) {
        case 'p2pkh':
        case 'p2sh':
            return true;
        case 'bech32':
            return versionUtils.isNewerOrEqual(version, FIRST_FIRMWARE_WITH_BECH32);
        case 'bech32m':
            // Bech32m did not exist when these firmware versions were released.
            return false;
        // no default
    }
};

/** Output script type the firmware needs to accept an external destination address. */
export const getDestinationOutputScriptType = (
    version: FirmwareVersion,
    format: Exclude<DestinationFormat, 'bech32m'>,
): PROTO.OutputScriptType =>
    format === 'p2sh' && !versionUtils.isNewerOrEqual(version, FIRST_FIRMWARE_DETECTING_OUTPUT_TYPE)
        ? 'PAYTOSCRIPTHASH'
        : 'PAYTOADDRESS';

/**
 * Firmware 1.5.1-1.6.3 trusts the host for SegWit input amounts (CVE-2020-14199). The user has to
 * be told never to confirm the same address with the same amount twice.
 */
export const isAffectedBySegwitAmountVulnerability = (version: FirmwareVersion) =>
    versionUtils.isNewerOrEqual(version, FIRST_FIRMWARE_WITH_BITCOIN_SEGWIT);

export const WRONG_PIN_ATTEMPTS_BEFORE_WIPE = 16;

/** Since firmware 1.5.1 the device erases itself after 16 wrong PIN attempts. */
export const wipesAfterWrongPinAttempts = (version: FirmwareVersion) =>
    versionUtils.isNewerOrEqual(version, FIRST_FIRMWARE_WITH_BITCOIN_SEGWIT);

/** Before firmware 1.6.1 addresses are shown in a proportional font that is easy to misread. */
export const showsAddressInProportionalFont = (version: FirmwareVersion) =>
    !versionUtils.isNewerOrEqual(version, FIRST_FIRMWARE_WITH_FIXED_WIDTH_ADDRESS);

export const isEthereumSupported = (version: FirmwareVersion) =>
    versionUtils.isNewerOrEqual(version, MIN_ETHEREUM_FIRMWARE);

/** Before firmware 1.5.1 the Ethereum destination is shown as lowercase hex without `0x`. */
export const showsEthereumAddressChecksum = (version: FirmwareVersion) =>
    versionUtils.isNewerOrEqual(version, FIRST_FIRMWARE_WITH_CHECKSUMMED_ETHEREUM_ADDRESS);

export const formatFirmwareVersion = (version: FirmwareVersion) => version.join('.');
