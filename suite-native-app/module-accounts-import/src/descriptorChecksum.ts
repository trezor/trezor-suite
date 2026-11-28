/**
 * The descriptor without a trailing `#<checksum>`. Firmware's displayed descriptor, which Suite shows
 * and lets the user copy, ends with one computed over its `h` form, so it does not survive the
 * conversion to the canonical apostrophe form; the backend recomputes it.
 */
export const withoutDescriptorChecksum = (descriptor: string) =>
    descriptor.split('#')[0] ?? descriptor;

/**
 * Whether two imported descriptors belong to the same account. Older versions stored an account
 * imported from a checksummed descriptor with the suffix, so a re-import of that account must still
 * be recognised.
 */
export const isSameImportedDescriptor = (descriptor: string, otherDescriptor: string) =>
    withoutDescriptorChecksum(descriptor) === withoutDescriptorChecksum(otherDescriptor);
