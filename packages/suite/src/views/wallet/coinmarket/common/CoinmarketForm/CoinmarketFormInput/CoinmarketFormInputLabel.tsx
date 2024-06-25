import { Translation } from 'src/components/suite';
import { CoinmarketFormInputLabelProps } from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketFormInputLabelWrapper } from 'src/views/wallet/coinmarket';

const CoinmarketFormInputLabel = ({ label }: CoinmarketFormInputLabelProps) => {
    if (!label) return null;

    return (
        <CoinmarketFormInputLabelWrapper>
            <Translation id={label} />
        </CoinmarketFormInputLabelWrapper>
    );
};

export default CoinmarketFormInputLabel;
