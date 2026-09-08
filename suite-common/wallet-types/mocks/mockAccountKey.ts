import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { StaticSessionId } from '@trezor/device-utils';

import { type AccountKey, asAccountDescriptor, createAccountKey } from '../src/account';

const MOCK_DEVICE_STATIC_SESSION_ID: StaticSessionId =
    'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0';
type MockAccountKeyParams = {
    descriptor?: string;
    symbol?: NetworkSymbol;
    deviceStaticSessionId?: StaticSessionId;
};

/**
 * Build a valid `AccountKey` for tests without typing out the
 * `${descriptor}-${networkSymbol}-${staticSessionId}` template by hand.
 *
 * `descriptor` must not contain `-` (it's the AccountKey separator); pick a
 * hyphen-free identifier for the account under test.
 */
export const mockAccountKey = ({
    descriptor = 'mockDescriptor',
    symbol = 'btc',
    deviceStaticSessionId = MOCK_DEVICE_STATIC_SESSION_ID,
}: MockAccountKeyParams = {}): AccountKey =>
    createAccountKey({
        accountDescriptor: asAccountDescriptor(descriptor),
        networkSymbol: symbol,
        deviceStaticSessionId,
    });
