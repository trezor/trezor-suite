import { Translation } from '@suite/intl';
import type { TranslationKey } from '@suite/intl';
import { BulletList, Button, Card, Column, Row, Text } from '@trezor/components';
import type { BulletListItemState } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

import { YieldAmountCard } from './YieldAmountCard';
import type { YieldFlowActionStep, YieldFlowDisplayToken } from './types';

export type YieldActionStepProps = {
    token: YieldFlowDisplayToken;
    state: BulletListItemState;
    amount: string;
    step: YieldFlowActionStep;
    titleTranslationId: TranslationKey;
    amountLabelTranslationId: TranslationKey;
    submitTranslationId: TranslationKey;
    onAmountSelect: (amount: string) => void;
    onSubmit: () => void;
};

export const YieldActionStep = ({
    token,
    state,
    amount,
    step,
    titleTranslationId,
    amountLabelTranslationId,
    submitTranslationId,
    onAmountSelect,
    onSubmit,
}: YieldActionStepProps) => {
    const isActive = state === 'active';

    return (
        <BulletList.Item state={state} title={<Translation id={titleTranslationId} />}>
            {isActive && (
                <Column gap={16}>
                    <Card fillType="flat" paddingType="small">
                        <Row justifyContent="space-between" alignItems="center" width="100%">
                            <Text typographyStyle="body-sm">
                                <Translation id="TR_EARN_YIELD_APPROVED_AMOUNT" />
                            </Text>
                            <Row alignItems="center" gap={8}>
                                {token.coingeckoId ? (
                                    <AssetLogo
                                        size={20}
                                        coingeckoId={token.coingeckoId}
                                        placeholder={token.symbol}
                                        symbol={token.networkSymbol}
                                        contractAddress={token.contractAddress}
                                    />
                                ) : (
                                    <CoinLogo
                                        size={20}
                                        symbol={token.networkSymbol}
                                        type="tokenWithNetwork"
                                    />
                                )}
                                <Text typographyStyle="body-sm-strong">
                                    {step.isApprovedUnlimited ? (
                                        <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
                                    ) : (
                                        `${step.approvedAmount} ${token.symbol}`
                                    )}
                                </Text>
                            </Row>
                        </Row>
                    </Card>

                    <YieldAmountCard
                        amount={amount}
                        tokenSymbol={token.symbol}
                        fractionMaxAmount={step.maxAmount}
                        tokenDecimals={token.decimals}
                        amountError={step.amountError}
                        heading={{
                            amountLabelTranslationId,
                        }}
                        onAmountChange={onAmountSelect}
                        onFractionClick={onAmountSelect}
                    />

                    <Button
                        size="large"
                        width="100%"
                        onClick={onSubmit}
                        isDisabled={step.isDisabled}
                    >
                        <Translation id={submitTranslationId} />
                    </Button>
                </Column>
            )}
        </BulletList.Item>
    );
};
