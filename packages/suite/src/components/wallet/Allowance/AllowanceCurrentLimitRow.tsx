import { AssetIcon, AssetSymbol } from '@suite/assets';
import { Translation, type TranslationKey } from '@suite/intl';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CardList, Column, Icon, Row, Text } from '@trezor/components';
import { ArrowRightIcon } from '@trezor/icons';

import { AllowanceAmount } from './AllowanceAmount';

type AllowanceCurrentLimitRowProps = {
    label: TranslationKey;
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    amount: string;
    /** The limit is about to be reset to zero. */
    isRevoked?: boolean;
};

export const AllowanceCurrentLimitRow = ({
    label,
    networkSymbol,
    contractAddress,
    amount,
    isRevoked = false,
}: AllowanceCurrentLimitRowProps) => (
    <CardList.Item>
        <Text typographyStyle="body-sm">
            <Translation id={label} />
        </Text>
        <Row gap={8}>
            <AssetIcon networkSymbol={networkSymbol} contractAddress={contractAddress} size={20} />
            <AllowanceAmount
                amount={amount}
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                typographyStyle="body-sm-strong"
            />
            {isRevoked && (
                <>
                    <Column alignSelf="center">
                        <Icon as={ArrowRightIcon} size={16} />
                    </Column>
                    <Text typographyStyle="body-sm-strong">
                        0{' '}
                        <AssetSymbol
                            networkSymbol={networkSymbol}
                            contractAddress={contractAddress}
                        />
                    </Text>
                </>
            )}
        </Row>
    </CardList.Item>
);
