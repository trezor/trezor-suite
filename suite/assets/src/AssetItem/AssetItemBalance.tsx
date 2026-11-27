import { useSelector } from 'react-redux';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { selectIsDiscreteModeActive } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AssetBalance } from '@suite-common/wallet-types';
import { asAmountUnit } from '@suite-common/wallet-utils';
import {
    Column,
    type FrameProps,
    TOOLTIP_DELAY_LONG,
    Text,
    TruncateWithTooltip,
} from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { AssetValue } from '../AssetValue';

export type AssetItemBalanceProps = Pick<FrameProps, 'width' | 'maxWidth'> & {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    balance: AssetBalance;
    isDisabled?: boolean;
};

export const AssetItemBalance = ({
    networkSymbol,
    contractAddress,
    balance: { cryptoAmount, fiatAmount },
    isDisabled,
    width,
    maxWidth,
}: AssetItemBalanceProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const isDiscreetMode = useSelector(selectIsDiscreteModeActive);
    const cryptoValue = (
        <AssetValue
            amount={asAmountUnit(new BigNumber(cryptoAmount))}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            isCompact
        />
    );

    return (
        <Column
            alignItems="flex-end"
            minWidth={0}
            overflow="hidden"
            width={width}
            maxWidth={maxWidth}
        >
            {fiatAmount !== null && (
                <Text
                    typographyStyle="body-md"
                    intent="neutral"
                    isDisabled={isDisabled}
                    ellipsisLineCount={1}
                    maxWidth="100%"
                >
                    <HiddenPlaceholder>
                        <BaseCurrencyAmountFormatter value={fiatAmount} />
                    </HiddenPlaceholder>
                </Text>
            )}
            <Text
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
                isDisabled={isDisabled}
                ellipsisLineCount={1}
                maxWidth="100%"
            >
                {isDiscreetMode ? (
                    cryptoValue
                ) : (
                    <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                        {cryptoValue}
                    </TruncateWithTooltip>
                )}
            </Text>
        </Column>
    );
};
