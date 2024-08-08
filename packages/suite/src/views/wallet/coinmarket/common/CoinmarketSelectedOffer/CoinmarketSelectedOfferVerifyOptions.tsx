import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Translation } from 'src/components/suite';
import {
    CoinmarketSelectedOfferVerifyOptionsProps,
    CoinmarketVerifyFormAccountOptionProps,
} from 'src/types/coinmarket/coinmarketVerify';
import CoinmarketSelectedOfferVerifyOptionsItem from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferVerifyOptionsItem';

const SelectWrapper = styled.div`
    position: relative;
    z-index: 30;
`;

const CoinmarketSelectedOfferVerifyOptions = ({
    receiveNetwork,
    selectAccountOptions,
    selectedAccountOption,
    isMenuOpen,
    onChangeAccount,
}: CoinmarketSelectedOfferVerifyOptionsProps) => {
    return (
        <SelectWrapper>
            <Select
                onChange={(selected: CoinmarketVerifyFormAccountOptionProps) =>
                    onChangeAccount(selected)
                }
                value={selectedAccountOption}
                isClearable={false}
                options={selectAccountOptions}
                minValueWidth="70px"
                formatOptionLabel={option => (
                    <CoinmarketSelectedOfferVerifyOptionsItem
                        option={option}
                        receiveNetwork={receiveNetwork}
                    />
                )}
                menuIsOpen={isMenuOpen}
                isDisabled={selectAccountOptions.length === 1}
                placeholder={
                    <Translation
                        id="TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT"
                        values={{ symbol: receiveNetwork?.toUpperCase() }}
                    />
                }
            />
        </SelectWrapper>
    );
};

export default CoinmarketSelectedOfferVerifyOptions;
