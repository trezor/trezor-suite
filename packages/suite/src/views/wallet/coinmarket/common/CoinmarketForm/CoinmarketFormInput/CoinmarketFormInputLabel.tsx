import { Translation } from 'src/components/suite';
import { CoinmarketFormInputLabelProps } from 'src/types/coinmarket/coinmarketForm';
import {
    CoinmarketFormInputLabelText,
    CoinmarketFormInputLabelWrapper,
} from 'src/views/wallet/coinmarket';

export const CoinmarketFormInputLabel = ({ label, children }: CoinmarketFormInputLabelProps) => {
    if (!label) return null;

    return (
        <CoinmarketFormInputLabelWrapper>
            <CoinmarketFormInputLabelText>
                <Translation id={label} />
            </CoinmarketFormInputLabelText>
            {children}
        </CoinmarketFormInputLabelWrapper>
    );
};
