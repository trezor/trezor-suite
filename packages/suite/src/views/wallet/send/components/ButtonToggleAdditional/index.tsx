import React from 'react';
import { variables, colors, Icon } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

const Wrapper = styled.div`
    display: flex;
    min-height: 41px;
    align-items: center;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK17};
`;

const ToggleIcon = styled(Icon)`
    margin-left: 8px;
`;

const Text = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`;

interface Props {
    isAdditionalFormVisible: boolean;
    setAdditionFormVisibility: (isVisible: boolean) => boolean;
}

export default (props: Props) => (
    <Wrapper>
        <Text
            onClick={() => {
                if (props.isAdditionalFormVisible) {
                    props.setAdditionFormVisibility(false);
                } else {
                    props.setAdditionFormVisibility(true);
                }
            }}
        >
            {props.isAdditionalFormVisible ? (
                <Translation id="TR_HIDE_ADVANCED_OPTIONS" />
            ) : (
                <Translation id="TR_SHOW_ADVANCED_OPTIONS" />
            )}

            <ToggleIcon
                icon="ARROW_DOWN"
                color={colors.BLACK17}
                size={12}
                isActive={props.isAdditionalFormVisible}
                canAnimate={props.isAdditionalFormVisible}
            />
        </Text>
    </Wrapper>
);
