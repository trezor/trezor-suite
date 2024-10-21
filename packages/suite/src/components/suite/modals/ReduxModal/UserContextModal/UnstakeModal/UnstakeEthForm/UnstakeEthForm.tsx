import styled from 'styled-components';
import { Divider, Icon, Paragraph, Tooltip, Banner, Row, Column } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { Options } from './Options';
import { getUnstakingPeriodInDays } from 'src/utils/suite/stake';
import UnstakeFees from './Fees';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { getAccountEverstakeStakingPool } from '@suite-common/wallet-utils';
import { ApproximateInstantEthAmount } from 'src/views/wallet/staking/components/EthStakingDashboard/components/ApproximateInstantEthAmount';
import { BigNumber } from '@trezor/utils';

const DividerWrapper = styled.div`
    & > div {
        background: ${({ theme }) => theme.borderElevation2};
        width: calc(100% + ${spacingsPx.xxl});
        margin: 0 -${spacingsPx.md} ${spacingsPx.lg} -${spacingsPx.md};
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledWarning = styled(Banner)`
    justify-content: flex-start;
`;

const WarningsWrapper = styled.div`
    margin-bottom: ${spacingsPx.sm};
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

export const UnstakeEthForm = () => {
    const selectedAccount = useSelector(selectSelectedAccount);

    const {
        account,
        formState: { errors },
        handleSubmit,
        signTx,
        approximatedInstantEthAmount,
    } = useUnstakeEthFormContext();

    const { symbol } = account;

    const { validatorWithdrawTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );
    const unstakingPeriod = getUnstakingPeriodInDays(validatorWithdrawTime);
    const { canClaim = false, claimableAmount = '0' } =
        getAccountEverstakeStakingPool(selectedAccount) ?? {};

    const inputError = errors[CRYPTO_INPUT] || errors[FIAT_INPUT];
    const showError = inputError && inputError.type === 'compose';
    const shouldShowInstantUnstakeEthAmount =
        approximatedInstantEthAmount && BigNumber(approximatedInstantEthAmount).gt(0);

    return (
        <form onSubmit={handleSubmit(signTx)}>
            {canClaim && (
                <StyledWarning variant="info">
                    <Translation
                        id="TR_STAKE_CAN_CLAIM_WARNING"
                        values={{
                            amount: claimableAmount,
                            symbol: symbol.toUpperCase(),
                            br: <br />,
                        }}
                    />
                </StyledWarning>
            )}

            <Options symbol={symbol} />

            <WarningsWrapper>
                {showError && (
                    <StyledWarning variant="destructive">{inputError?.message}</StyledWarning>
                )}
            </WarningsWrapper>

            <DividerWrapper>
                <Divider />
            </DividerWrapper>

            <Column gap={spacings.lg} alignItems="normal" hasDivider>
                <UnstakeFees />

                <Column gap={spacings.md} alignItems="normal" margin={{ bottom: spacings.lg }}>
                    <Row justifyContent="space-between">
                        <Paragraph typographyStyle="body" variant="tertiary">
                            <Translation id="TR_STAKE_UNSTAKING_PERIOD" />
                        </Paragraph>
                        <Translation
                            id="TR_UP_TO_DAYS"
                            values={{
                                count: unstakingPeriod,
                            }}
                        />
                    </Row>

                    {shouldShowInstantUnstakeEthAmount && (
                        <Row justifyContent="space-between">
                            <Row gap={spacings.xxs}>
                                <Paragraph typographyStyle="body" variant="tertiary">
                                    <Translation
                                        id="TR_STAKE_UNSTAKING_APPROXIMATE"
                                        values={{
                                            symbol: symbol.toUpperCase(),
                                        }}
                                    />
                                </Paragraph>

                                <Tooltip
                                    maxWidth={328}
                                    content={
                                        <Translation id="TR_STAKE_UNSTAKING_APPROXIMATE_DESCRIPTION" />
                                    }
                                >
                                    <Icon name="info" size={14} />
                                </Tooltip>
                            </Row>

                            <ApproximateInstantEthAmount
                                value={approximatedInstantEthAmount}
                                symbol={symbol.toUpperCase()}
                            />
                        </Row>
                    )}
                </Column>
            </Column>
        </form>
    );
};
