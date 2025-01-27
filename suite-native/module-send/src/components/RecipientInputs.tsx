import React from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { CardDivider, VStack } from '@suite-native/atoms';

import { AddressInput } from './AddressInput';
import { AmountInputs } from './AmountInputs';
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
