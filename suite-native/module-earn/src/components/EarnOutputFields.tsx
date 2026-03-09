import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnAmountInputs } from './EarnAmountInputs';

type EarnOutputFieldsProps = {
    accountKey: AccountKey;
};

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
}));

export const EarnOutputFields = ({ accountKey }: EarnOutputFieldsProps) => {
    const { applyStyle } = useNativeStyles();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!symbol) return null;

    return (
        <Card style={applyStyle(cardStyle)}>
            <EarnAmountInputs accountKey={accountKey} symbol={symbol} />
        </Card>
    );
};
