import React from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { Header, Content, ViewWrapper, GuideNode, GuideCategories } from '@guide-components';
import { useActions, useSelector } from '@suite-hooks';
import { Translation } from '@suite-components';
import * as guideActions from '@suite-actions/guideActions';
import { getNodeTitle } from '@suite-utils/guide';

const Section = styled.div`
    margin-bottom: 20px;

    &:not(:last-of-type) {
        margin-bottom: 100px;
    }
`;

const SectionHeading = styled.h3`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    padding: 8px 0 18px 0;
`;

const Nodes = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
`;

export const GuideCategory = () => {
    const { currentNode, language } = useSelector(state => ({
        currentNode: state.guide.currentNode,
        language: state.suite.settings.language,
    }));
    const { setView } = useActions({
        setView: guideActions.setView,
    });

    if (!currentNode || currentNode.type === 'page') {
        return null;
    }

    const title = getNodeTitle(currentNode, language);

    // Right now we support only 2 levels of categories
    // Level 1 category has its own view
    // Level 2 category is part of level 1 category view
    const pages = currentNode.children.filter(child => child.type === 'page');
    const subcategories = currentNode.children.filter(child => child.type === 'category');

    return (
        <ViewWrapper>
            <Header back={() => setView('GUIDE_DEFAULT')} label={title} />
            <Content>
                {pages.length ? (
                    <Section>
                        <SectionHeading>
                            <Translation id="TR_GUIDE_ARTICLES" />
                        </SectionHeading>
                        <Nodes data-test="@guide/nodes">
                            {pages.map(page => (
                                <GuideNode key={page.id} node={page} />
                            ))}
                        </Nodes>
                    </Section>
                ) : null}
                {subcategories.length
                    ? subcategories.map(subcategory =>
                          subcategory.type === 'category' ? (
                              <GuideCategories
                                  key={subcategory.id}
                                  node={subcategory}
                                  label={getNodeTitle(subcategory, language)}
                              />
                          ) : null,
                      )
                    : null}
            </Content>
        </ViewWrapper>
    );
};
