import { DotIndicator, Icon } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

export type TransactionReviewOutputState = 'active' | 'confirmed' | 'unconfirmed';

type TransactionReviewOutputStatusProps = {
    state: TransactionReviewOutputState;
};

export const TransactionReviewOutputStatus = ({ state }: TransactionReviewOutputStatusProps) => {
    switch (state) {
        case 'confirmed':
            return <Icon size={16} intent="brand" as={CheckIcon} />;
        case 'unconfirmed':
            return <DotIndicator />;
        default:
            return <DotIndicator isActive={true} />;
    }
};
