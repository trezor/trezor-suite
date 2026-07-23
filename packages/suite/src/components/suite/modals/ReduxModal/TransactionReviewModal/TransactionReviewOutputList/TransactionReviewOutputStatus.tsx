import { DotIndicator, Icon } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { type TransactionReviewOutputElementProps } from 'src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputElement';

type TransactionReviewOutputStatusProps = {
    state: TransactionReviewOutputElementProps['state'];
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
