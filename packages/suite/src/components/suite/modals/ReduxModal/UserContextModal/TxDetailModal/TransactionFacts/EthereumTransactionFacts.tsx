import { Translation } from '@suite/intl';
import { Icon, Tooltip } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { type TransactionFactsOverrideProps } from './transactionFactsTypes';

/**
 * The EVM facts as every other network shows them, plus the warning on a nonce that is stuck.
 * Whether it is stuck depends on the account's other pending transactions, which only the app
 * knows, so the network states the nonce and the app decorates it.
 */
export const EthereumTransactionFacts = ({
    facts,
    context: { nonceStatus, nextNonce },
    DefaultFacts,
}: TransactionFactsOverrideProps) => (
    <DefaultFacts
        facts={facts}
        decorate={fact =>
            fact.id === 'nonce' &&
            nonceStatus &&
            nonceStatus !== 'ok' && (
                <Tooltip
                    content={
                        nonceStatus === 'superseded' ? (
                            <Translation
                                id="TR_PENDING_NONCE_SUPERSEDED_WARNING"
                                values={{ nonce: nextNonce }}
                            />
                        ) : (
                            <Translation
                                id="TR_BUMP_FEE_NONCE_GAP_WARNING"
                                values={{ nonce: nextNonce }}
                            />
                        )
                    }
                >
                    <Icon as={WarningIcon} size={16} intent="warning" />
                </Tooltip>
            )
        }
    />
);
