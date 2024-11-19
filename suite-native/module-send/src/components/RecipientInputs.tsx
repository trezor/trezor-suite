import React from 'react';
import { useSelector } from 'react-redux';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { VStack, CardDivider } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

import { AmountInputs } from './AmountInputs';
import { AddressInput } from './AddressInput';
import { DestinationTagInput } from './DestinationTagInput';

type RecipientInputsProps = {
    index: number;
    accountKey: AccountKey;
};
export const RecipientInputs = ({ index, accountKey }: RecipientInputsProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    const isRipple = account.networkType === 'ripple';

    return (
        <VStack spacing="sp16">
            <AddressInput index={index} accountKey={accountKey} />
            <CardDivider />
            <AmountInputs index={index} />
            {isRipple && (
                <Animated.View layout={LinearTransition}>
                    <VStack spacing="sp16">
                        <CardDivider />
                        <DestinationTagInput />
                    </VStack>
                </Animated.View>
            )}
        </VStack>
    );
};
