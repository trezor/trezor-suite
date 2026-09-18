import { Column, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { type AssetAccounts, selectAssetBalance } from './homeAssetTableSelectors';

type HomeAssetBalanceProps = {
    assetAccounts: AssetAccounts;
    deviceState: StaticSessionId;
};

export const HomeAssetBalance = ({ assetAccounts, deviceState }: HomeAssetBalanceProps) => {
    const balance = useSelector(state => selectAssetBalance(state, deviceState, assetAccounts));
    const [{ symbol, contractAddress }] = assetAccounts;

    if (balance === undefined) {
        return null;
    }

    return (
        <Column alignItems="flex-end" gap={2}>
            <BaseCurrencyValue
                amount={balance.amount}
                symbol={symbol}
                tokenAddress={contractAddress}
            />
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <FormattedCryptoAmount
                    value={balance.amount}
                    symbol={balance.tokenInfo?.symbol ?? symbol}
                    contractAddress={contractAddress}
                />
            </Text>
        </Column>
    );
};
