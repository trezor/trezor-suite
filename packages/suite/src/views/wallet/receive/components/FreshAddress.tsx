import { useMemo } from 'react';

import styled from 'styled-components';
import { Translation, QuestionTooltip, ReadMoreLink } from 'src/components/suite';
import { AppState } from 'src/types/suite';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { useDispatch, useSelector } from 'src/hooks/suite/';

import { Button, Card, variables, H2, Tooltip, GradientOverlay } from '@trezor/components';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';
import { AccountsRootState, selectIsAccountUtxoBased } from '@suite-common/wallet-core';
import { networks } from '@suite-common/wallet-config';
import { EvmExplanationBox } from 'src/components/wallet/EvmExplanationBox';
import { spacingsPx, typography } from '@trezor/theme';

const StyledCard = styled(Card)`
    width: 100%;
    flex-flow: row wrap;
    margin-bottom: ${spacingsPx.md};
    align-items: center;
    justify-content: space-between;
    padding: ${spacingsPx.xxl} ${spacingsPx.xxxl};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: ${spacingsPx.xxl} ${spacingsPx.lg};
    }

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        button {
            width: 100%;
            margin-left: auto;
            margin-top: ${spacingsPx.sm};
        }
    }
`;

const AddressContainer = styled.div`
    flex: 1;
`;

const StyledButton = styled(Button)`
    min-width: 220px;
    margin-left: ${spacingsPx.lg};
`;

const FreshAddressWrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    margin-top: ${spacingsPx.xs};
`;

const StyledFreshAddress = styled(H2)`
    color: ${({ theme }) => theme.textDefault};
`;
const AddressLabel = styled.span`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
    text-transform: uppercase;
    font-variant-numeric: slashed-zero tabular-nums;
`;

const StyledEvmExplanationBox = styled(EvmExplanationBox)`
    margin-top: 26px;
`;

const TooltipLabel = ({
    symbol,
    multipleAddresses,
    accountType,
}: {
    symbol: string;
    multipleAddresses: boolean;
    accountType: string;
}) => {
    const addressLabel = (
        <AddressLabel>
            <Translation id={multipleAddresses ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS'} />
        </AddressLabel>
    );

    if (symbol === 'ltc' && accountType === 'segwit') {
        // additional tooltip with LTC addresses explanation
        return (
            <QuestionTooltip
                label={addressLabel}
                tooltip={<ReadMoreLink message="TR_LTC_ADDRESS_INFO" url="LTC_ADDRESS_INFO_URL" />}
            />
        );
    }
    if (symbol === 'bch') {
        // additional tooltip with BCH addresses explanation
        return (
            <QuestionTooltip
                label={addressLabel}
                tooltip={
                    <ReadMoreLink message="TR_BCH_ADDRESS_INFO" url="HELP_CENTER_CASHADDR_URL" />
                }
            />
        );
    }

    return addressLabel;
};

interface FreshAddressProps {
    account: AppState['wallet']['selectedAccount']['account'];
    addresses: AppState['wallet']['receive'];
    disabled: boolean;
    locked: boolean;
    pendingAddresses: string[];
}

export const FreshAddress = ({
    account,
    addresses,
    disabled,
    pendingAddresses,
    locked,
}: FreshAddressProps) => {
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, account?.key ?? ''),
    );
    const dispatch = useDispatch();

    const firstFreshAddress = useMemo(() => {
        if (account) {
            return getFirstFreshAddress(account, addresses, pendingAddresses, isAccountUtxoBased);
        }
    }, [account, addresses, pendingAddresses, isAccountUtxoBased]);

    if (!account) return null;

    const addressValue = firstFreshAddress?.address?.substring(0, 20);

    // On coinjoin account, disallow to reveal more than the first receive address until it is used,
    // because discovery of coinjoin account relies on assumption that user uses his first address first.
    const coinjoinDisallowReveal =
        account.accountType === 'coinjoin' &&
        !account.addresses?.used.length &&
        firstFreshAddress?.address !== account.addresses?.unused[0]?.address;

    const handleAddressReveal = () => {
        if (firstFreshAddress)
            dispatch(showAddress(firstFreshAddress.path, firstFreshAddress.address));
    };

    const buttonTooltipContent = () => {
        if (coinjoinDisallowReveal) {
            return <Translation id="RECEIVE_ADDRESS_COINJOIN_DISALLOW" />;
        }
        if (!firstFreshAddress) {
            return <Translation id="RECEIVE_ADDRESS_LIMIT_REACHED" />;
        }

        return null;
    };

    return (
        <StyledCard>
            <AddressContainer>
                <TooltipLabel
                    multipleAddresses={isAccountUtxoBased}
                    symbol={account.symbol}
                    accountType={account.accountType}
                />
                <FreshAddressWrapper>
                    {addressValue && <GradientOverlay hiddenFrom="220px" />}
                    <StyledFreshAddress>
                        {addressValue ?? <Translation id="RECEIVE_ADDRESS_UNAVAILABLE" />}
                    </StyledFreshAddress>
                </FreshAddressWrapper>
            </AddressContainer>
            <Tooltip content={buttonTooltipContent()}>
                <StyledButton
                    data-test-id="@wallet/receive/reveal-address-button"
                    icon="TREZOR_LOGO"
                    onClick={handleAddressReveal}
                    isDisabled={disabled || locked || coinjoinDisallowReveal || !firstFreshAddress}
                    isLoading={locked}
                >
                    <Translation id="RECEIVE_ADDRESS_REVEAL" />
                </StyledButton>
            </Tooltip>
            {/* TODO: POLYGON DEBUG */}
            {account.networkType === 'ethereum' && account.symbol === 'matic' && (
                <StyledEvmExplanationBox
                    caret
                    symbol={account.symbol}
                    title={
                        <Translation
                            id="TR_EVM_EXPLANATION_TITLE"
                            values={{
                                network: networks[account.symbol].name,
                            }}
                        />
                    }
                >
                    <Translation
                        id="TR_EVM_EXPLANATION_RECEIVE_DESCRIPTION"
                        values={{
                            network: networks[account.symbol].name,
                        }}
                    />
                </StyledEvmExplanationBox>
            )}
        </StyledCard>
    );
};
