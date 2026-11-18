import { Translation, type TranslationKey } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CardList, Column, Icon, Row, Text } from '@trezor/components';
import { ArrowRightIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { AllowanceAmount } from './AllowanceAmount';

type AllowanceCurrentLimitRowProps = {
    label: TranslationKey;
    networkSymbol: NetworkSymbol;
    contractAddress: string;
    symbol: string;
    decimals: number;
    amount: string;
    /** The limit is about to be reset to zero. */
    isRevoked?: boolean;
};

export const AllowanceCurrentLimitRow = ({
    label,
    networkSymbol,
    contractAddress,
    symbol,
    decimals,
    amount,
    isRevoked = false,
}: AllowanceCurrentLimitRowProps) => (
    <CardList.Item>
        <Text typographyStyle="body-sm">
            <Translation id={label} />
        </Text>
        <Row gap={8}>
            <TokenIcon
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                size={20}
                placeholder={symbol}
            />
            <AllowanceAmount
                amount={amount}
                symbol={symbol}
                contractAddress={contractAddress}
                decimals={decimals}
                typographyStyle="body-sm-strong"
            />
            {isRevoked && (
                <>
                    <Column alignSelf="center">
                        <Icon as={ArrowRightIcon} size={16} />
                    </Column>
                    <Text typographyStyle="body-sm-strong">0 {symbol}</Text>
                </>
            )}
        </Row>
    </CardList.Item>
);
