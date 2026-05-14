import { DotIndicator, Icon } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { type TransactionReviewOutputElementProps } from 'src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputElement';

type TransactionReviewOutputStatusProps = {
    state: TransactionReviewOutputElementProps['state'];
};

export const TransactionReviewOutputStatus = ({ state }: TransactionReviewOutputStatusProps) => {
    switch (state) {
        case 'confirmed':
            return <Icon size={spacings.md} intent="brand" name="check" />;
        case 'unconfirmed':
            return <DotIndicator />;
        default:
            return <DotIndicator isActive={true} />;
    }
};
