import { createTransform } from 'redux-persist';

import { type ReceiveState } from '@suite-common/receive';

const removeCurrentFreshAddresses = (
    accounts: ReceiveState['accounts'] = {},
): ReceiveState['accounts'] => {
    const accountsWithoutCurrentFreshAddresses = Object.fromEntries(
        Object.entries(accounts).flatMap(([accountKey, accountState]) =>
            accountState
                ? [
                      [
                          accountKey,
                          {
                              touchedAddresses: accountState.touchedAddresses,
                              currentFreshAddress: undefined,
                          },
                      ],
                  ]
                : [],
        ),
    );

    return accountsWithoutCurrentFreshAddresses;
};

export const receivePersistTransform = createTransform<
    ReceiveState['accounts'],
    ReceiveState['accounts']
>(removeCurrentFreshAddresses, removeCurrentFreshAddresses, { whitelist: ['accounts'] });
