import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol, isWrappedNativeToken } from '@suite-common/wallet-config';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button, Column, Divider, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useDispatch } from 'src/hooks/suite';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldFlowTransferRow } from './YieldFlowTransferRow';
import { YieldTokenValue } from './YieldTokenValue';

type YieldFlowCompleteWithdrawProps = {
    input: YieldFlowCompleteValue;
    output?: YieldFlowCompleteValue;
    vaultId: string;
    account?: Account;
};

export const YieldFlowCompleteWithdraw = ({
    input,
    output,
    vaultId,
    account,
}: YieldFlowCompleteWithdrawProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const receivedValue = output ?? input;

    const showUnwrapOffer =
        !!account &&
        isWrappedNativeToken(
            receivedValue.token.networkSymbol,
            receivedValue.token.contractAddress,
        ) &&
        new BigNumber(receivedValue.amount).gt(0);

    const handleUnwrapOfferClick = () => {
        if (!account) {
            return;
        }

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'unwrap-offer',
                networkSymbol: account.symbol,
                vaultId,
            },
        });
        analytics.report({
            type: events.wethUnwrapEvent.name,
            payload: {
                type: 'unwrap-form-modal',
                action: 'continue',
                networkSymbol: account.symbol,
                source: 'withdraw-complete',
            },
        });

        dispatch(
            openModal({
                type: 'unwrap-weth',
                account,
                prefillAmount: receivedValue.amount,
            }),
        );
    };

    return (
        <YieldFlowComplete
            type="withdraw"
            heading={<Translation id="TR_EARN_YIELD_WITHDRAW_COMPLETE" />}
            description={
                <Translation
                    id="TR_EARN_YIELD_WITHDRAW_COMPLETE_DESCRIPTION"
                    values={{ displaySymbol: receivedValue.token.symbol }}
                />
            }
            vaultId={vaultId}
            showFeedback
        >
            {output ? (
                <YieldFlowTransferRow
                    inputLabelId="TR_EARN_YIELD_AMOUNT_TO_WITHDRAW"
                    outputLabelId="TR_RECEIVED"
                    input={input}
                    output={output}
                />
            ) : (
                <Row
                    justifyContent="space-between"
                    alignItems="center"
                    padding={{ vertical: 16, horizontal: 20 }}
                >
                    <Column gap={8}>
                        <Text typographyStyle="body-md">
                            <Translation id="TR_RECEIVED" />
                        </Text>
                        <YieldTokenValue
                            token={{
                                ...receivedValue.token,
                                contractAddress: receivedValue.token.contractAddress ?? null,
                            }}
                            amount={receivedValue.amount}
                        />
                    </Column>
                </Row>
            )}

            {showUnwrapOffer && account && (
                <>
                    <Divider color="borderNeutral" margin={0} />
                    <Column gap={12} padding={{ vertical: 16, horizontal: 20 }}>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_UNWRAP_OFFER_TEXT"
                                values={{
                                    symbol: receivedValue.token.symbol,
                                    nativeSymbol: getNetworkDisplaySymbol(account.symbol),
                                }}
                            />
                        </Text>
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onClick={handleUnwrapOfferClick}
                        >
                            <Translation
                                id="TR_UNWRAP_TO_NATIVE"
                                values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                            />
                        </Button>
                    </Column>
                </>
            )}
        </YieldFlowComplete>
    );
};
