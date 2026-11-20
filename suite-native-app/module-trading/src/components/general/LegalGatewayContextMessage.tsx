import { Context } from '@suite-common/message-system';
import { ContextMessage, type ContextMessageProps } from '@suite-native/message-system';

export type LegalGatewayContextMessageProps = Omit<ContextMessageProps, 'context'>;

export const LegalGatewayContextMessage = (props: LegalGatewayContextMessageProps) => (
    <ContextMessage context={Context.getLegal('gateway')} {...props} />
);
