import type { Label, SendOptions } from '@trezor/network-module-suite-common-types';
import { RIPPLE_DESTINATION_TAG_MAX_DIGITS } from '@trezor/network-ripple/constants';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const rippleSendLabels = {
    destinationTag: { id: 'DESTINATION_TAG', defaultMessage: 'Memo/Destination tag' },
    addDestinationTag: { id: 'DESTINATION_TAG_SWITCH', defaultMessage: 'Add Memo/Destination tag' },
    notSet: { id: 'DESTINATION_TAG_NOT_SET', defaultMessage: "Memo/Destination tag isn't set" },
    notNumber: {
        id: 'DESTINATION_TAG_IS_NOT_NUMBER',
        defaultMessage: "Memo/Destination tag isn't a number",
    },
    notValid: {
        id: 'DESTINATION_TAG_IS_NOT_VALID',
        defaultMessage: "Memo/Destination tag isn't valid",
    },
} as const satisfies Record<string, Label>;

const MAX_DESTINATION_TAG = 0xffffffff;

/** A destination tag is an unsigned 32-bit integer, written without leading zeros. */
export const validateDestinationTag = (value: string): Label | undefined => {
    if (value.trim() === '' || Number.isNaN(Number(value))) {
        return rippleSendLabels.notNumber;
    }

    return /^(?:[1-9][0-9]*|0)$/.test(value) && Number(value) <= MAX_DESTINATION_TAG
        ? undefined
        : rippleSendLabels.notValid;
};

/**
 * Exchanges tell deposits apart by destination tag, so it is offered with every recipient and a
 * send with the tag turned on but empty is refused.
 */
export const rippleSendOptions: SendOptions = {
    getOptions: () => ({
        memo: {
            label: rippleSendLabels.destinationTag,
            prominence: 'recipient',
            addLabel: rippleSendLabels.addDestinationTag,
            maxLength: { value: RIPPLE_DESTINATION_TAG_MAX_DIGITS, unit: 'characters' },
            requiredMessage: rippleSendLabels.notSet,
            validate: validateDestinationTag,
        },
        broadcastToggle: true,
    }),
};
