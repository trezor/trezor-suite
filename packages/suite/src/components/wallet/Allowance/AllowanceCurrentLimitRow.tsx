import { Translation, type TranslationKey } from '@suite/intl';
import { TokenIcon, TokenSymbol } from '@suite/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CardList, Column, Icon, Row, Text } from '@trezor/components';
import { ArrowRightIcon } from '@trezor/icons';

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
                symbol={networkSymbol}
                contractAddress={toTokenAddress(contractAddress)}
                size={20}
            />
            <AllowanceAmount
                amount={amount}
                symbol={symbol}
                contractAddress={contractAddress}
                networkSymbol={networkSymbol}
                decimals={decimals}
                typographyStyle="body-sm-strong"
            />
            {isRevoked && (
                <>
                    <Column alignSelf="center">
                        <Icon as={ArrowRightIcon} size={16} />
                    </Column>
                    <Text typographyStyle="body-sm-strong">
                        0{' '}
                        <TokenSymbol
                            networkSymbol={networkSymbol}
                            tokenContract={toTokenAddress(contractAddress)}
                        />
                    </Text>
                </>
            )}
        </Row>
    </CardList.Item>
);
