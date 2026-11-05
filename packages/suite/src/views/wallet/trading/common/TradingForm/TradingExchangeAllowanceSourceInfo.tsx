import { Translation, type TranslationKey } from '@suite/intl';
import { type ExchangeAllowanceSource, type TradingExchangeAllowance } from '@suite-common/trading';
import { Column, Icon, Text, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

const SOURCE_TEXT_ID = {
    chain: 'TR_EXCHANGE_ALLOWANCE_SOURCE_CHAIN',
    provider: 'TR_EXCHANGE_ALLOWANCE_SOURCE_PROVIDER',
} as const satisfies Record<ExchangeAllowanceSource, TranslationKey>;

type TradingExchangeAllowanceSourceInfoProps = {
    source: ExchangeAllowanceSource;
    allowance: TradingExchangeAllowance | undefined;
    'data-testid'?: string;
};

export const TradingExchangeAllowanceSourceInfo = ({
    source,
    allowance,
    'data-testid': dataTest,
}: TradingExchangeAllowanceSourceInfoProps) => {
    const hasReadFailed = allowance?.status === 'error';

    return (
        <Tooltip
            content={
                <Column gap={4}>
                    <Text>
                        <Translation
                            id="TR_EXCHANGE_ALLOWANCE_SOURCE"
                            values={{ source: <Translation id={SOURCE_TEXT_ID[source]} /> }}
                        />
                    </Text>
                    {hasReadFailed && (
                        <Text wordBreak="break-all">
                            <Translation
                                id="TR_EXCHANGE_ALLOWANCE_CHAIN_ERROR"
                                values={{
                                    message: allowance?.errorMessage ?? (
                                        <Translation id="TR_UNKNOWN" />
                                    ),
                                }}
                            />
                        </Text>
                    )}
                </Column>
            }
        >
            <Icon
                as={InfoIcon}
                size={16}
                intent={hasReadFailed ? 'warning' : 'neutral'}
                priority="secondary"
                data-testid={dataTest}
            />
        </Tooltip>
    );
};
