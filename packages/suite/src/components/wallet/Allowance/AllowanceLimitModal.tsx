import { Translation, type TranslationKey } from '@suite/intl';
import { type AllowanceLimitType } from '@suite-common/wallet-types';
import { Badge, Card, Column, Modal, Paragraph, Row, Text } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { type AllowanceStepToken } from './AllowanceStepToken';

const LIMIT_TYPES = ['minimal', 'unlimited'] as const satisfies readonly AllowanceLimitType[];

const LIMIT_TYPE_LABEL_ID = {
    minimal: 'TR_APPROVAL_VALUE_MINIMAL',
    unlimited: 'TR_APPROVAL_VALUE_INFINITE',
} as const satisfies Record<AllowanceLimitType, TranslationKey>;

const LIMIT_TYPE_INFO_ID = {
    minimal: 'TR_APPROVAL_VALUE_MINIMAL_INFO',
    unlimited: 'TR_APPROVAL_VALUE_INFINITE_INFO',
} as const satisfies Record<AllowanceLimitType, TranslationKey>;

type AllowanceLimitModalProps = {
    limitType: AllowanceLimitType;
    amount: string;
    token: AllowanceStepToken;
    onSelect: (limitType: AllowanceLimitType) => void;
    onClose: () => void;
};

export const AllowanceLimitModal = ({
    limitType,
    amount,
    token,
    onSelect,
    onClose,
}: AllowanceLimitModalProps) => {
    const translationValues = { value: amount, send: token.symbol };

    return (
        <Modal
            heading={<Translation id="TR_APPROVAL_LIMIT_MODAL_HEADING" />}
            onCancel={onClose}
            isBackdropCancelable
            width={480}
            data-testid="@approval-limit-modal"
        >
            <Column gap={8}>
                {LIMIT_TYPES.map(type => (
                    <Card
                        key={type}
                        type="action"
                        isSelected={type === limitType}
                        onClick={() => onSelect(type)}
                        data-testid={`@approval-limit-modal/${type}`}
                    >
                        <Column gap={4} alignItems="flex-start">
                            <Row gap={8}>
                                <TokenIcon
                                    symbol={token.networkSymbol}
                                    contractAddress={token.contractAddress}
                                    size={20}
                                    placeholder={token.symbol}
                                />
                                <Text typographyStyle="body-md-strong">
                                    <Translation
                                        id={LIMIT_TYPE_LABEL_ID[type]}
                                        values={translationValues}
                                    />
                                </Text>
                            </Row>
                            <Paragraph
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation id={LIMIT_TYPE_INFO_ID[type]} />
                            </Paragraph>
                            {type === 'unlimited' && (
                                <Badge intent="warning" size="small" iconLeft={WarningIcon}>
                                    <Translation
                                        id="TR_APPROVAL_VALUE_INFINITE_WARNING"
                                        values={{ send: token.symbol }}
                                    />
                                </Badge>
                            )}
                        </Column>
                    </Card>
                ))}
            </Column>
        </Modal>
    );
};
