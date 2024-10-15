import { RefObject } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

import { FeeLevelLabel, ReviewOutput, ReviewOutputState } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

export type StatefulReviewOutput = ReviewOutput & { state: ReviewOutputState };

// TODO: add 'custom' in next send flow iteration
export type NativeSupportedFeeLevel = Exclude<FeeLevelLabel, 'custom' | 'low'>;

export type SendAmountInputProps = {
    recipientIndex: number;
    networkSymbol: NetworkSymbol;
    inputRef: RefObject<TextInput>;
    scaleValue: SharedValue<number>;
    translateValue: SharedValue<number>;
    isDisabled?: boolean;
    onPress?: TextInputProps['onPress'];
    onFocus?: () => void;
};
