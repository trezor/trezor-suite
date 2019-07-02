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

const Row = styled.View`
  flex-direction: row;
`;

type Props = {};
export default class App extends Component<Props> {
  render() {
    return (
      <Container>
        <Wrapper>
            <H1>
                Select
            </H1>
            <Select
                isSearchable
                placeholder="Example placeholder"
                options={[
                    { value: 'hello', label: 'Hello' },
                    { value: 'world', label: 'World' },
                ]}
                value={{
                  value: 'hello',
                  label: 'Hello'
                }}
            />
        </Wrapper>
        <Wrapper>
          <H1>
              Basic
          </H1>
          <Row>
              <Button variant="success" data-test="button_basic_success" onClick={() => {}}>
                  Button
              </Button>
              <Button variant="info" data-test="button_basic_info" onClick={() => {}}>
                  Button
              </Button>
              <Button variant="warning" data-test="button_basic_warning" onClick={() => {}}>
                  Button
              </Button>
              <Button variant="error" data-test="button_basic_error" onClick={() => {}}>
                  Button
              </Button>
          </Row>
          <Row>
              <Button data-test="button_basic_white" isWhite onClick={() => {}}>
                  White
              </Button>
              <Button data-test="button_basic_transparent" isTransparent onClick={() => {}}>
                  Transparent
              </Button>
              <Button data-test="button_basic_disabled" isDisabled onClick={() => {}}>
                  Disabled
              </Button>
          </Row>

          <H5>
              with an icon
          </H5>
          <Row>
              <Button icon="PLUS" variant="success" data-test="button_icon_success" onClick={() => {}}>
                  Button
              </Button>
              <Button icon="PLUS" variant="info" data-test="button_icon_info" onClick={() => {}}>
                  Button
              </Button>
              <Button icon="PLUS" variant="warning" data-test="button_icon_warning" onClick={() => {}}>
                  Button
              </Button>
              <Button icon="PLUS" variant="error" data-test="button_icon_error" onClick={() => {}}>
                  Button
              </Button>
          </Row>
          <Row>
              <Button icon="PLUS" isWhite data-test="button_icon_white" onClick={() => {}}>
                  White
              </Button>
              <Button icon="PLUS" isTransparent data-test="button_icon_transparent" onClick={() => {}}>
                  Transparent
              </Button>
              <Button icon="PLUS" isDisabled data-test="button_icon_disabled" onClick={() => {}}>
                  Disabled
              </Button>
          </Row>

          <H5>
              with loading
          </H5>
          <Row>
              <Button isLoading variant="success" data-test="button_loading_success" onClick={() => {}}>
                  Button
              </Button>
              <Button isLoading variant="info" data-test="button_loading_info" onClick={() => {}}>
                  Button
              </Button>
              <Button isLoading variant="warning" data-test="button_loading_warning" onClick={() => {}}>
                  Button
              </Button>
              <Button isLoading variant="error" data-test="button_loading_error" onClick={() => {}}>
                  Button
              </Button>
          </Row>
          <Row>
              <Button isLoading isWhite data-test="button_loading_white" onClick={() => {}}>
                  White
              </Button>
              <Button isLoading isTransparent data-test="button_loading_transparent" onClick={() => {}}>
                  Transparent
              </Button>
              <Button isLoading isDisabled data-test="button_loading_disabled" onClick={() => {}}>
                  Disabled
              </Button>
          </Row>

          <H1>
              Inverse
          </H1>
          <Row>
              <Button isInverse variant="success" data-test="button_inverse_success" onClick={() => {}}>
                  Button
              </Button>
              <Button isInverse variant="info" data-test="button_inverse_info" onClick={() => {}}>
                  Button
              </Button>
              <Button isInverse variant="warning" data-test="button_inverse_warning" onClick={() => {}}>
                  Button
              </Button>
              <Button isInverse variant="error" data-test="button_inverse_error" onClick={() => {}}>
                  Button
              </Button>
          </Row>
          <Row>
              <Button isInverse isWhite data-test="button_inverse_white" onClick={() => {}}>
                  White
              </Button>
              <Button isInverse isTransparent data-test="button_inverse_transparent" onClick={() => {}}>
                  Transparent
              </Button>
              <Button isInverse isDisabled data-test="button_inverse_disabled" onClick={() => {}}>
                  Disabled
              </Button>
          </Row>

          <H5>
              with an icon
          </H5>
          <Row>
              <Button isInverse icon="PLUS" variant="success" data-test="button_inverse_icon_success" onClick={() => {}}>
                  Button
              </Button>
              <Button isInverse icon="PLUS" variant="info" data-test="button_inverse_icon_info" onClick={() => {}}>
                  Button
              </Button>
              <Button isInverse icon="PLUS" variant="warning" data-test="button_inverse_icon_warning" onClick={() => {}}>
                  Button
              </Button>
              <Button isInverse icon="PLUS" variant="error" data-test="button_inverse_icon_error" onClick={() => {}}>
                  Button
              </Button>
          </Row>
          <Row>
              <Button isInverse icon="PLUS" isWhite data-test="button_inverse_icon_white" onClick={() => {}}>
                  White
              </Button>
              <Button isInverse icon="PLUS" isTransparent data-test="button_inverse_icon_transparent" onClick={() => {}}>
                  Transparent
              </Button>
              <Button isInverse icon="PLUS" isDisabled data-test="button_inverse_icon_disabled" onClick={() => {}}>
                  Disabled
              </Button>
          </Row>

          <H5>
              with loading
          </H5>
          <Row>
              <Button
                  isInverse
                  isLoading
                  variant="success"
                  data-test="button_inverse_loading_success"
                  onClick={() => {}}
              >
                  Button
              </Button>
              <Button isInverse isLoading variant="info" data-test="button_inverse_loading_info" onClick={() => {}}>
                  Button
              </Button>
              <Button
                  isInverse
                  isLoading
                  variant="warning"
                  data-test="button_inverse_loading_warning"
                  onClick={() => {}}
              >
                  Button
              </Button>
              <Button isInverse isLoading variant="error" data-test="button_inverse_loading_error" onClick={() => {}}>
                  Button
              </Button>
          </Row>
          <Row>
              <Button isInverse isLoading isWhite data-test="button_inverse_loading_white" onClick={() => {}}>
                  White
              </Button>
              <Button
                  isInverse
                  isLoading
                  isTransparent
                  data-test="button_inverse_loading_transparent"
                  onClick={() => {}}
              >
                  Transparent
              </Button>
              <Button isInverse isLoading isDisabled data-test="button_inverse_loading_disabled" onClick={() => {}}>
                  Disabled
              </Button>
          </Row>
          <H1>
              Pin
          </H1>
          <Row>
              <ButtonPin onClick={() => {}} />
          </Row>
        </Wrapper>
        <Wrapper>
          <H5>Notifications</H5>
          <Notification
            variant="success"
            title="Notification title"
            message="Text of the notification."
            actions={[{
              label: 'Ok',
              callback: () => {}
            }]}
          />
          <Notification
            variant="warning"
            title="Notification title"
            message="Text of the notification."
            actions={[{
              label: 'Cancel',
              callback: () => {}
            }]}
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
          <H5>Loader</H5>
          <Loader
            size={100}
            strokeWidth={2}
            text="loading"
          />
        </Wrapper>
        <Wrapper>
          <H5>Prompt</H5>
          <Prompt model={1}>
            Complete the action on your device
          </Prompt>
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
            value="test"
            onDeleteClick={() => {}}
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
