import React from 'react';
import { MenuListComponentProps, createFilter } from 'react-select';

import styled, { keyframes } from 'styled-components';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import messages from '@suite/support/messages';
import { Select, variables } from '@trezor/components';
import { BIP_39 } from '@suite-constants';
import { FixedSizeList as List } from 'react-window';

const options = BIP_39.map(item => ({ label: item, value: item }));

const shake = keyframes`
    10%, 90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%, 80% {
        transform: translate3d(2px, 0, 0);
    }

    30%, 50%, 70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%, 60% {
        transform: translate3d(4px, 0, 0);
    }
`;

const SelectWrapper = styled.div`
    animation: ${shake} 1.3s;
    margin: 12px auto 0px auto;
    text-align: left;

    width: 380px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 280px;
    }
`;

type Option = { label: string; value: string };

const MenuList = (props: MenuListComponentProps<Option>) => {
    const children = React.Children.toArray(props.children);
    return (
        <List height={32 * 5} itemCount={children.length} itemSize={32} width="100%">
            {({ index, style }) => <div style={style}>{children[index]}</div>}
        </List>
    );
};

interface Props extends WrappedComponentProps {
    onSubmit: (word: string) => void;
}

const WordInput = React.memo((props: Props) => {
    const { onSubmit } = props;

    const MemoSelect = React.memo(() => {
        return (
            <Select
                autoFocus
                isSearchable
                isClearable={false}
                controlShouldRenderValue={false}
                noOptionsMessage={({ inputValue }: { inputValue: string }) =>
                    props.intl.formatMessage(messages.TR_WORD_DOES_NOT_EXIST, { word: inputValue })
                }
                onChange={(item: any) => {
                    onSubmit(item.value);
                }}
                components={{ MenuList }}
                placeholder={props.intl.formatMessage(messages.TR_CHECK_YOUR_DEVICE)}
                options={options}
                filterOption={createFilter({
                    ignoreCase: true,
                    trim: true,
                    matchFrom: 'start',
                })}
                data-test="@word-input-select"
            />
        );
    });

    return (
        <SelectWrapper>
            <MemoSelect />
        </SelectWrapper>
    );
});

export default injectIntl(WordInput);
