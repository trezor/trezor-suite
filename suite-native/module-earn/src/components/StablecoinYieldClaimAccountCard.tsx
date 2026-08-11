import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type AccountKey, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { selectAccountLabel } from '@suite-native/accounts';
import { AddressFormatter, BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { type CombinedLabelingState } from '@suite-native/labeling';

import { EarnAccountCardLayout } from './EarnAccountCardLayout';

type StablecoinYieldClaimAccountCardProps = {
    accountKey: AccountKey;
    fiatClaimableAmount: BaseCurrencyAmount | null;
    networkSymbol: NetworkSymbol;
    onPress: () => void;
};

export const StablecoinYieldClaimAccountCard = ({
    accountKey,
    fiatClaimableAmount,
    networkSymbol,
    onPress,
}: StablecoinYieldClaimAccountCardProps) => {
    const { accountDescriptor, deviceStaticSessionId } = parseAccountKey(accountKey);
    const customAccountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, deviceStaticSessionId, accountDescriptor, networkSymbol),
    );

    return (
        <EarnAccountCardLayout
            accountKey={accountKey}
            icon={<TokenIcon symbol={networkSymbol} size="extraSmall" />}
            title={customAccountLabel ?? getNetworkDisplaySymbolName(networkSymbol)}
            description={
                <AddressFormatter
                    value={accountDescriptor}
                    format="short"
                    variant="body-sm"
                    color="contentSecondary"
                    numberOfLines={1}
                />
            }
            value={
                <BaseCurrencyAmountFormatter
                    value={fiatClaimableAmount}
                    variant="body-md"
                    isDiscreetText={false}
                    numberOfLines={1}
                />
            }
            onPress={onPress}
        />
    );
};
