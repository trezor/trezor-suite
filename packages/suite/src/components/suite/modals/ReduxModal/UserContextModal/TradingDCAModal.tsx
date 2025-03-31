import { ReactElement, useState } from 'react';

import { CryptoId } from 'invity-api';

import { TrezorDevice } from '@suite-common/suite-types';
import { cryptoIdToNetwork, getTradingNetworkDecimals } from '@suite-common/trading/src/utils';
import { Network, getNetwork } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { formatAmount } from '@suite-common/wallet-utils';
import {
    Button,
    Column,
    Divider,
    Icon,
    InfoSegments,
    List,
    NewModal,
    Paragraph,
    Row,
    Select,
    Text,
    Tooltip,
} from '@trezor/components';
import { AccountAddress } from '@trezor/connect';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { onCancel as closeModal, openModal } from 'src/actions/suite/modalActions';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { AccountLabeling, Translation } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import useTradingVerifyAccount from 'src/hooks/wallet/trading/form/useTradingVerifyAccount';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { TradingVerifyFormAccountOptionProps } from 'src/types/trading/tradingVerify';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';

const cryptoId = 'bitcoin' as CryptoId;

interface AccountSelectProps {
    value?: TradingVerifyFormAccountOptionProps;
    options: TradingVerifyFormAccountOptionProps[];
    onChange: (account: TradingVerifyFormAccountOptionProps) => void;
    disabled?: boolean;
    network: Network;
}

const AccountSelect = ({ value, options, onChange, disabled, network }: AccountSelectProps) => (
    <Select
        onChange={onChange}
        value={value}
        options={options}
        minValueWidth="70px"
        isDisabled={disabled}
        labelLeft={
            <Tooltip hasIcon content={<Translation id="TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP" />}>
                <Translation id="TR_BUY_RECEIVING_ACCOUNT" />
            </Tooltip>
        }
        placeholder={
            <Translation
                id="TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT"
                values={{ symbol: network.displaySymbol }}
            />
        }
        formatOptionLabel={option => {
            if (option.type === 'SUITE' && option.account) {
                const { symbol, formattedBalance } = option.account;

                return (
                    <Row gap={spacings.sm}>
                        <CoinLogo size={20} symbol={symbol} />
                        <Column alignItems="flex-start">
                            <Row>
                                <AccountLabeling
                                    account={option.account}
                                    accountTypeBadgeSize="small"
                                    showAccountTypeBadge
                                />
                            </Row>
                            <TradingBalance
                                balance={formattedBalance}
                                displaySymbol={getNetwork(symbol).displaySymbol}
                                symbol={symbol}
                            />
                        </Column>
                    </Row>
                );
            }

            if (option.type === 'ADD_SUITE') {
                return (
                    <Row gap={spacings.sm}>
                        <Icon name="plus" size={20} variant="tertiary" />
                        <Column alignItems="flex-start">
                            <Translation
                                id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                                values={{
                                    symbol: network.name,
                                }}
                            />
                        </Column>
                    </Row>
                );
            }

            return null;
        }}
    />
);

interface AddressSelectProps {
    value?: AccountAddress;
    options: { label: React.ReactNode; options: AccountAddress[] }[] | undefined;
    onChange: (addr: AccountAddress) => void;
    disabled?: boolean;
    addressLabels: Record<string, string>;
    network: Network;
}

const AddressSelect = ({
    value,
    options,
    onChange,
    disabled,
    addressLabels,
    network,
}: AddressSelectProps) => {
    const networkDecimals = getTradingNetworkDecimals({
        sendCryptoSelect: undefined,
        network,
    });

    return (
        <Select
            value={value}
            labelLeft={
                <Tooltip
                    hasIcon
                    content={<Translation id="TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP" />}
                >
                    <Translation id="TR_BUY_RECEIVING_ADDRESS" />
                </Tooltip>
            }
            options={options}
            minValueWidth="70px"
            onChange={onChange}
            isDisabled={disabled}
            placeholder={
                <Translation
                    id="TR_EXCHANGE_RECEIVING_ADDRESS"
                    values={{ symbol: network.displaySymbol }}
                />
            }
            formatOptionLabel={(accountAddress: AccountAddress) => {
                const balance = accountAddress.balance
                    ? formatAmount(accountAddress.balance, networkDecimals)
                    : accountAddress.balance;

                return (
                    <Column>
                        <div>{addressLabels[accountAddress.address] || accountAddress.address}</div>
                        <InfoSegments typographyStyle="label" variant="tertiary">
                            <TradingBalance
                                balance={balance}
                                displaySymbol={network.displaySymbol}
                                symbol={network.symbol}
                            />
                            {accountAddress.path}
                        </InfoSegments>
                    </Column>
                );
            }}
        />
    );
};

interface Options {
    label: ReactElement;
    options: AccountAddress[];
}

const buildOptions = (addresses: Account['addresses']) => {
    if (!addresses) return undefined;

    const unused: Options = {
        label: <Translation id="RECEIVE_TABLE_NOT_USED" />,
        options: addresses.unused,
    };

    const used: Options = {
        label: <Translation id="RECEIVE_TABLE_USED" />,
        options: addresses.used,
    };

    return [unused, used];
};

interface TradingDCAModalProps {
    device: TrezorDevice;
    onCancel: () => void;
}

const getModalDetail = () => (
    <List
        gap={spacings.lg}
        bulletGap={spacings.md}
        typographyStyle="hint"
        margin={{ top: spacings.xs }}
    >
        <List.Item bulletComponent={<Icon name="suitcaseSimple" variant="primary" />}>
            <Paragraph variant="tertiary">
                <Translation id="TR_TRADING_DCA_FEATURE_1_SUBHEADING" />
            </Paragraph>
        </List.Item>
        <List.Item bulletComponent={<Icon name="shieldCheck" variant="primary" />}>
            <Paragraph variant="tertiary">
                <Translation id="TR_TRADING_DCA_FEATURE_2_SUBHEADING" />
            </Paragraph>
        </List.Item>
        <List.Item bulletComponent={<Icon name="handCoins" variant="primary" />}>
            <Paragraph variant="tertiary">
                <Translation id="TR_TRADING_DCA_FEATURE_3_SUBHEADING" />
            </Paragraph>
        </List.Item>
    </List>
);

export const TradingDCAModal = ({ device, onCancel }: TradingDCAModalProps) => {
    const [selectedAccountOption, setSelectedAccountOption] = useState<
        TradingVerifyFormAccountOptionProps | undefined
    >();
    const [selectedAddress, setSelectedAddress] = useState<AccountAddress | undefined>();
    const dispatch = useDispatch();
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked(true);

    const tradingVerifyAccount = useTradingVerifyAccount({
        cryptoId,
        nonSuiteAccount: false,
    });

    const accountMetadata = useSelector(state =>
        selectLabelingDataForAccount(state, selectedAccountOption?.account?.key || ''),
    );

    const network = cryptoIdToNetwork(cryptoId);

    const getModal = () => {
        const handleConfirmAddressClick = () => {
            if (!device || !selectedAccountOption || !selectedAddress) return;

            dispatch(showAddress(selectedAddress.path, selectedAddress.address));
        };

        const onChangeAccount = (account: TradingVerifyFormAccountOptionProps) => {
            setSelectedAddress(undefined);

            if (account.type === 'ADD_SUITE' && device && network) {
                dispatch(
                    openModal({
                        type: 'add-account',
                        device,
                        symbol: network.symbol,
                        noRedirect: true,
                        isCoinjoinDisabled: true,
                        isBackClickDisabled: true,
                        onCancel: () => {
                            dispatch(closeModal());
                            dispatch(
                                openModal({
                                    type: 'trading-dca',
                                    device,
                                }),
                            );
                        },
                    }),
                );

                return;
            }

            setSelectedAccountOption(account);
        };

        const onChangeAddress = (address: AccountAddress) => {
            setSelectedAddress(address);
        };

        return {
            heading: <Translation id="TR_CONFIRM_ON_TREZOR" />,
            children: network ? (
                <>
                    {getModalDetail()}
                    <Divider margin={{ top: spacings.xl, bottom: spacings.md }} />

                    <Column gap={spacings.md}>
                        <AccountSelect
                            value={selectedAccountOption}
                            options={tradingVerifyAccount.selectAccountOptions}
                            onChange={onChangeAccount}
                            network={network}
                        />
                        <AddressSelect
                            value={selectedAddress}
                            options={buildOptions(selectedAccountOption?.account?.addresses)}
                            onChange={onChangeAddress}
                            disabled={!selectedAccountOption}
                            network={network}
                            addressLabels={accountMetadata.addressLabels}
                        />
                        <Button
                            isDisabled={!selectedAddress}
                            onClick={handleConfirmAddressClick}
                            isLoading={isDeviceLocked}
                        >
                            <Text>
                                <Translation id="TR_CONFIRM_ON_TREZOR" />
                            </Text>
                        </Button>
                    </Column>
                </>
            ) : null,
        };
    };

    return <NewModal onCancel={onCancel} size="small" {...getModal()} />;
};
