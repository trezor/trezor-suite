import styled from 'styled-components';
import { AutoScalingInput as Input } from './AutoScalingInput';
import { Meta } from '@storybook/react';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const BorderAutoScalingInput = styled(Input)`
    padding: 1px 5px;
    border-radius: 3px;
    border-style: solid;
    border-width: 1px;
`;

const BorderlessAutoScalingInput = styled(Input)`
    padding: 1px 5px;
    border-style: solid;
    border-width: 0;
    background-color: #ccc;
`;

const meta: Meta = {
    title: 'Form/AutoScalingInput',
};
export default meta;

export const AutoScalingInput = {
    render: () => (
        <>
            <Wrapper>
                <div>Border</div>
                <BorderAutoScalingInput minWidth={130} />
                <BorderAutoScalingInput
                    minWidth={120}
                    placeholder="Chancellor on the Brink of Second Bailout for Banks"
                />
                <div>Borderless</div>
                <BorderlessAutoScalingInput minWidth={130} />
                <BorderlessAutoScalingInput
                    minWidth={120}
                    placeholder="Chancellor on the Brink of Second Bailout for Banks"
                />
            </Wrapper>
        </>
    ),
};
