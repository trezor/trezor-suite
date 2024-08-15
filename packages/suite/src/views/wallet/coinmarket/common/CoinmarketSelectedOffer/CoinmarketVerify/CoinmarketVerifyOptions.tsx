import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Translation } from 'src/components/suite';
import {
    CoinmarketVerifyOptionsProps,
    CoinmarketVerifyFormAccountOptionProps,
} from 'src/types/coinmarket/coinmarketVerify';
import { CoinmarketVerifyOptionsItem } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketVerify/CoinmarketVerifyOptionsItem';

const SelectWrapper = styled.div`
    position: relative;
    z-index: 30;
`;

export const CoinmarketVerifyOptions = ({
    receiveNetwork,
    selectAccountOptions,
    selectedAccountOption,
    isMenuOpen,
    onChangeAccount,
}: CoinmarketVerifyOptionsProps) => {
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
                    <CoinmarketVerifyOptionsItem option={option} receiveNetwork={receiveNetwork} />
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
