import React from 'react';
import styled, { css } from 'styled-components';
import { Input, Select, variables as oldVariables } from '@trezor/components';
import { Button, Switch, P, Link, colors, variables } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

const { SCREEN_SIZE } = oldVariables;

const ActionButton = styled(Button)`
    min-width: 170px;
    margin-left: 10px;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

const SectionHeader = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 28px 24px;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const TextColumn = styled.div`
    display: flex;
    flex-direction: column;
`;

const SmallDescription = styled.div`
    color: ${colors.BLACK50};
    margin: 4px 16px 4px 0;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const LearnMoreWrapper = styled(Link)`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK17};
`;

const LearnMore = ({ href, ...props }: { href: string }) => (
    <LearnMoreWrapper href={href} {...props}>
        <Translation>{messages.TR_LEARN_MORE_LINK}</Translation>
    </LearnMoreWrapper>
);

const Description = styled(P)`
    line-height: 1.29;
`;

const ActionColumn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const ActionInput = styled(Input)`
    width: 170px;
    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

const ActionSelect = styled(Select)`
    width: 170px;
    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

interface SectionProps {
    borderless?: boolean;
}

const SectionWrapper = styled.div<SectionProps>`
    border-radius: 6px;
    margin-top: 16px;
    margin-bottom: 30px;

    ${({ borderless }) =>
        !borderless &&
        css`
            border: 1px solid ${colors.BLACK96};
        `}

    /* actually using ${Row} works but stylelint doesnt like */
    & > div:not(:last-child) {
        border-bottom: 1px solid ${colors.BLACK96};
    }
    & > div:not(:first-child) {
        border-top: 1px solid ${colors.BLACK96};
    }
`;

type Value = React.ReactNode;

type Left =
    | {
          type: 'description' | 'small-description';
          value: Value;
      }
    | {
          type: 'learn-more';
          href: string;
      };

interface Right {
    type: 'button' | 'input' | 'switch' | 'select';
    value?: Value;
    props?: any;
}

interface RowProps {
    hide?: boolean;
    left?: readonly Left[];
    right?: readonly Right[];
}

interface Props {
    borderless?: boolean;
    rows: readonly RowProps[];
    controlsDisabled?: boolean;
    header?: Value;
}

let id = 0;
const getKey = () => {
    id++;
    return id.toString();
};

const Section = ({ borderless, rows, controlsDisabled, header }: Props) => {
    return (
        <>
            {header && <SectionHeader>{header}</SectionHeader>}

            <SectionWrapper borderless={borderless}>
                {rows
                    .filter(r => !r.hide)
                    .map(r => (
                        <Row key={getKey()}>
                            <TextColumn>
                                {r.left &&
                                    r.left.map(rl => (
                                        <React.Fragment key={getKey()}>
                                            {rl.type === 'description' && (
                                                <Description>{rl.value}</Description>
                                            )}
                                            {rl.type === 'small-description' && (
                                                <SmallDescription>{rl.value}</SmallDescription>
                                            )}
                                            {rl.type === 'learn-more' && (
                                                <LearnMore href={rl.href} />
                                            )}
                                        </React.Fragment>
                                    ))}
                            </TextColumn>
                            <ActionColumn>
                                {r.right &&
                                    r.right.map(rr => (
                                        <React.Fragment key={getKey()}>
                                            {rr.type === 'button' && (
                                                <ActionButton
                                                    variant="secondary"
                                                    isDisabled={controlsDisabled}
                                                    {...rr.props}
                                                >
                                                    {rr.value}
                                                </ActionButton>
                                            )}
                                            {rr.type === 'switch' && (
                                                <Switch
                                                    // todo: switch does not support isDisabled
                                                    // isDisabled={uiLocked}
                                                    {...rr.props}
                                                />
                                            )}
                                            {rr.type === 'input' && (
                                                <ActionInput
                                                    isDisabled={controlsDisabled}
                                                    {...rr.props}
                                                />
                                            )}
                                            {rr.type === 'select' && (
                                                <ActionSelect
                                                    isDisabled={controlsDisabled}
                                                    {...rr.props}
                                                />
                                            )}
                                        </React.Fragment>
                                    ))}
                            </ActionColumn>
                        </Row>
                    ))}
            </SectionWrapper>
        </>
    );
};

export default Section;
