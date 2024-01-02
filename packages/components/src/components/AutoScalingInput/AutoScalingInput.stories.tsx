import styled from 'styled-components';
import { AutoScalingInput } from './AutoScalingInput';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const BorderAutoScalingInput = styled(AutoScalingInput)`
    padding: 1px 5px 1px 5px;
    border-radius: 3px;
    border-style: solid;
    border-width: 1px;
`;

const BorderlessAutoScalingInput = styled(AutoScalingInput)`
    padding: 1px 5px 1px 5px;
    border-style: solid;
    border-width: 0px;
    background-color: #ccc;
`;

export default {
    title: 'Misc/AutoScalingInput',
};

export const Box = {
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
