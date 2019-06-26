/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import styled from 'styled-components/native';
import { 
  H1, 
  H2, 
  H3, 
  H4, 
  H5, 
  H6, 
  P, 
  Link, 
  TrezorImage, 
  Button, 
  ButtonPin, 
  Checkbox,
  Input,
  CoinLogo,
  TrezorLogo,
  Header,
  InputPin,
  TextArea,
  Switch,
  Prompt,
  Notification,
  Select,
  Loader
} from '@trezor/components';

const Container = styled.ScrollView.attrs({
  contentContainerStyle: {
    justifyContent: 'center',
    paddingTop: 50,
  }
})``;

const Wrapper = styled.View`
  padding: 10px;
`;

type Props = {};
export default class App extends Component<Props> {
  render() {
    return (
      <Container>
        <Wrapper>
          <H5>Loader</H5>
          <Loader
            size={100}
            strokeWidth={1}
            text="loading"
          />
        </Wrapper>
        <Wrapper>
          <H5>Select</H5>
          <Select
            items={[
              {
                value: 'en',
                label: 'English',
              },
              {
                value: 'bn',
                label: 'Bengali',
              },
              {
                value: 'cs',
                label: 'Česky',
              },
            ]}
            onChange={() => {}}
          />
        </Wrapper>
        <Wrapper>
          <H5>Notifications</H5>
          <Notification
            variant="success"
            title="Notification title"
            message="Text of the notification."
          />
          <Notification
            variant="warning"
            title="Notification title"
            message="Text of the notification."
          />
          <Notification
            variant="info"
            title="Notification title"
            message="Text of the notification."
          />
          <Notification
            variant="error"
            title="Notification title"
            message="Text of the notification."
          />
        </Wrapper>
        <Wrapper>
          <H5>Prompt</H5>
          <Prompt model={1} size={32}>
            Complete the action on your device
          </Prompt>
        </Wrapper>
        <Wrapper>
          <H5>Switch</H5>
          <Switch
            onChange={() => {}}
            checked={false}
          />
        </Wrapper>
        <Wrapper>
          <H5>TextArea</H5>
          <TextArea
            value=""
            placeholder="placeholder..."
            bottomText="bottom text"
            topLabel="Textarea label"
            tooltipAction={null}
          />
        </Wrapper>
        <Wrapper>
          <H5>InputPin</H5>
          <InputPin
            value=""
            onDeleteClick={() => {}}
          />
        </Wrapper>
        <Wrapper>
          <H5>Header</H5>
          <Header
            sidebarEnabled={true}
            sidebarOpened={false}
            togglerOpenText="Menu"
            togglerCloseText="Close"
            rightAddon={null}
            logoLinkComponent={<Link />}
            links={[
              {
                href: 'https://trezor.io/',
                title: 'Trezor'
              },
              {
                href: 'https://wiki.trezor.io/',
                title: 'Wiki'
              },
              {
                href: 'https://blog.trezor.io/',
                title: 'Blog'
              },
            ]}
          />
        </Wrapper>
        <Wrapper>
          <H5>TrezorLogo Horizontal</H5>
          <TrezorLogo
            type="horizontal"
            width={200}
            height={50}
          />
        </Wrapper>
        <Wrapper>
          <H5>TrezorLogo Vertical</H5>
          <TrezorLogo
            type="vertical"
            width={100}
            height={100}
          />
        </Wrapper>
        <Wrapper>
          <H5>CoinLogo</H5>
          <CoinLogo
            height={23}
            network="ada"
          />
        </Wrapper>
        <Wrapper>
          <H5>Button</H5>
          <Button variant="success">
            Button Text
          </Button>
        </Wrapper>
        <Wrapper>
          <H5>ButtonPin</H5>
          <ButtonPin onClick={() => {}} />
        </Wrapper>
        <Wrapper>
          <H5>Checkbox</H5>
          <Checkbox onClick={() => {}}>
            Checkbox
          </Checkbox>
        </Wrapper>
        <Wrapper>
          <H5>Input</H5>
          <Input
            value=""
            placeholder="placeholder..."
            bottomText="bottom text"
            topLabel="Input label"
            onChange={() => {}}
            tooltipAction={null}
          />
        </Wrapper>
        <Wrapper>
          <H1>Heading 1 with <Link href="https://trezor.io">link</Link></H1>
          <H2>Heading 2</H2>
          <H3>Heading 3</H3>
          <H4>Heading 4</H4>
          <H5>Heading 5</H5>
          <H6>Heading 6</H6>
        </Wrapper>
        <Wrapper>
          <H5>Link</H5>
          <Link href="https://trezor.io">Trezor.io</Link>
        </Wrapper>
        <Wrapper>
          <H5>Paragraph</H5>
          <P size='small'>
            This is an paragraph small
          </P>
          <P size='medium'>
            This is an paragraph medium
          </P>
          <P size='large'>
            This is an paragraph large
          </P>
          <P size='xlarge'>
            This is an paragraph xlarge
          </P>
        </Wrapper>
        <Wrapper>
          <H5>TrezorImage</H5>
          <TrezorImage
            height={310}
            model={1}
          />
          <TrezorImage
            height={310}
            model={2}
          />
        </Wrapper>
      </Container>
    );
  }
}
