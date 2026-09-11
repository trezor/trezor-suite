// pathUtils moved to @trezor/connect-common so it can be shared without a deep import into
// @trezor/connect (see #27376). Re-exported here to keep connect's internal call sites unchanged.
export * from '@trezor/connect-common/src/utils/pathUtils';
