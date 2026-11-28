import { useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { CardList, Modal } from '@trezor/components';

import { FormSelectRow } from '../FormSelectRow/FormSelectRow';

export type ReceiveAccountSelectValue = AccountKey | undefined;

export type ReceiveAccountOption = {
    accountKey: AccountKey;
    label: string;
};

type ReceiveAccountSelectProps = {
    value: ReceiveAccountSelectValue;
    onChange: (accountKey: AccountKey) => void;
    options: ReceiveAccountOption[];
    label: TranslationKey;
};

// TEMPORARY(POC): accounts only, shown as a plain label. The real receive picker (AccountLabeling,
// addresses, non-Suite address, network activation) lives in packages/suite TradingReceiveAddress and
// cannot be imported into @suite/trading.
export const ReceiveAccountSelect = ({
    value,
    onChange,
    options,
    label,
}: ReceiveAccountSelectProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedOption = options.find(option => option.accountKey === value);

    const handleSelect = (accountKey: AccountKey) => {
        onChange(accountKey);
        setIsModalOpen(false);
    };

    return (
        <>
            <FormSelectRow
                label={<Translation id={label} />}
                onClick={() => setIsModalOpen(true)}
                isDisabled={options.length === 0}
                data-testid="@trading/receive-address-picker"
            >
                {selectedOption?.label ?? <Translation id="TR_RECEIVE_ACCOUNT_NOT_SELECTED" />}
            </FormSelectRow>
            {isModalOpen && (
                <Modal
                    width={480}
                    onCancel={() => setIsModalOpen(false)}
                    heading={<Translation id={label} />}
                >
                    <CardList>
                        {options.map(option => (
                            <CardList.Item
                                key={option.accountKey}
                                onClick={() => handleSelect(option.accountKey)}
                            >
                                {option.label}
                            </CardList.Item>
                        ))}
                    </CardList>
                </Modal>
            )}
        </>
    );
};
