import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import {
    Text,
    Box,
    NumPadButton,
    Hint,
    SearchInput,
    Radio,
    CheckBox,
    Switch,
    ListItem,
    SelectableListItem,
    IconButton,
    InputWrapper,
    Input,
    VStack,
    Button,
    ButtonColorScheme,
    Divider,
} from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import {
    CryptoIcon,
    EthereumTokenIcon,
    EthereumTokenIconName,
    ethereumTokenIcons,
    Icon,
    IconName,
    icons,
} from '@trezor/icons';
import { TransactionNotification } from '@suite-native/notifications';
import { CryptoIcon, Icon, IconName, icons } from '@trezor/icons';
import { ToastNotificationVariant, ToastNotification } from '@suite-native/notifications';
import { CoinsSettings } from '@suite-native/module-settings';

const inputStackStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.medium,
    padding: utils.spacings.small,
}));

export const DemoScreen = () => {
    const { applyStyle } = useNativeStyles();
    const [input2Text, setInput2Text] = useState<string>('');
    const [input3Text, setInput3Text] = useState<string>('sf51s4afsfwfs8f4');
    const [radioChecked, setRadioChecked] = useState<string>('second');
    const [isCheckBox1Checked, setIsCheckBox1Checked] = useState(false);
    const [isCheckBox2Checked, setIsCheckBox2Checked] = useState(true);
    const [isCheckBox3Checked, setIsCheckBox3Checked] = useState(false);
    const [isCheckBox4Checked, setIsCheckBox4Checked] = useState(true);
    const [isSwitchActive, setIsSwitchActive] = useState<boolean>(true);
    const [isSwitch2Active, setIsSwitch2Active] = useState<boolean>(false);
    const [inputText, setInputText] = useState<string>('');
    const demoInputRef = useRef<TextInput | null>(null);

    const buttonColorSchemes = [
        'primary',
        'secondary',
        'tertiaryElevation0',
        'dangerElevation0',
    ] satisfies ButtonColorScheme[];

    const toastNotificationVariants = [
        'default',
        'success',
        'warning',
        'error',
        'info',
    ] satisfies ToastNotificationVariant[];

    const handleRadioPress = (value: string | number) => {
        setRadioChecked(value.toString());
    };

    return (
        <Screen header={<ScreenHeader />}>
            <VStack spacing="medium">
                <VStack>
                    <Text variant="titleSmall">Transaction Notifications:</Text>
                    <Text variant="titleSmall">Toast Notifications:</Text>
                    <VStack
                        justifyContent="center"
                        style={{ flexDirection: 'row', flexWrap: 'wrap' }}
                    >
                        {toastNotificationVariants.map(toastVariant => (
                            <ToastNotification variant={toastVariant} title={toastVariant} />
                        ))}
                    </VStack>
                </VStack>
                <VStack>
                    <Text variant="titleSmall">Button:</Text>
                    {buttonColorSchemes.map(buttonScheme => (
                        <VStack key={buttonScheme}>
                            <Text>{buttonScheme}</Text>
                            <Box
                                flexDirection="row"
                                justifyContent="space-around"
                                alignItems="center"
                            >
                                <Button colorScheme={buttonScheme} size="large" iconLeft="calendar">
                                    Large
                                </Button>

                                <Button
                                    colorScheme={buttonScheme}
                                    size="medium"
                                    iconLeft="calendar"
                                >
                                    Medium
                                </Button>

                                <Button colorScheme={buttonScheme} size="small" iconLeft="calendar">
                                    Small
                                </Button>
                            </Box>
                        </VStack>
                    ))}
                </VStack>
                <Divider />
                <VStack>
                    <Text variant="titleSmall">IconButton:</Text>
                    {buttonColorSchemes.map(buttonScheme => (
                        <View key={buttonScheme}>
                            <Text>{buttonScheme}</Text>
                            <Box
                                flexDirection="row"
                                justifyContent="space-around"
                                alignItems="center"
                            >
                                <IconButton
                                    colorScheme={buttonScheme}
                                    size="large"
                                    iconName="calendar"
                                >
                                    Large
                                </IconButton>

                                <IconButton
                                    colorScheme={buttonScheme}
                                    size="medium"
                                    iconName="calendar"
                                >
                                    Medium
                                </IconButton>

                                <IconButton
                                    colorScheme={buttonScheme}
                                    size="small"
                                    iconName="calendar"
                                >
                                    Small
                                </IconButton>
                            </Box>
                        </View>
                    ))}
                    <View>
                        <Text>with title</Text>
                        <Box flexDirection="row" justifyContent="space-around" alignItems="center">
                            <IconButton
                                colorScheme="primary"
                                size="large"
                                iconName="calendar"
                                title="large"
                            >
                                Large
                            </IconButton>

                            <IconButton
                                colorScheme="primary"
                                size="medium"
                                iconName="calendar"
                                title="medium"
                            >
                                Medium
                            </IconButton>

                            <IconButton
                                colorScheme="primary"
                                size="small"
                                iconName="calendar"
                                title="small"
                            >
                                Small
                            </IconButton>
                        </Box>
                    </View>
                </VStack>
                <Divider />
                <Box>
                    <SearchInput
                        value={inputText}
                        onChange={setInputText}
                        placeholder="Type here.."
                    />
                    <Box marginVertical="medium">
                        <VStack style={applyStyle(inputStackStyle)} spacing="small">
                            <InputWrapper label="Recipient">
                                <Input
                                    ref={demoInputRef}
                                    value={input2Text}
                                    onChangeText={setInput2Text}
                                    label="To"
                                />
                            </InputWrapper>
                            <InputWrapper>
                                <Input
                                    value={input3Text}
                                    onChangeText={setInput3Text}
                                    label="From"
                                    leftIcon={<CryptoIcon name="btc" size="extraSmall" />}
                                    hasWarning
                                />
                            </InputWrapper>
                        </VStack>
                    </Box>
                    <Box marginVertical="medium">
                        <VStack style={applyStyle(inputStackStyle)} spacing="small">
                            <InputWrapper hint="This input is not valid.">
                                <Input
                                    value={input2Text}
                                    onChangeText={setInput2Text}
                                    label="To"
                                    hasError
                                />
                            </InputWrapper>
                        </VStack>
                    </Box>
                    <Box marginTop="large">
                        <Text variant="titleLarge">Title Large</Text>
                    </Box>
                    <Box>
                        <Text variant="titleMedium">Title Medium</Text>
                    </Box>
                    <Switch
                        isChecked={isSwitchActive}
                        onChange={() => setIsSwitchActive(!isSwitchActive)}
                    />
                    <Switch
                        isChecked={isSwitch2Active}
                        onChange={() => setIsSwitch2Active(!isSwitch2Active)}
                        isDisabled
                    />
                    <Box marginVertical="medium">
                        <Text>Icon:</Text>
                        <Icon name="warningCircle" size="large" />
                    </Box>
                    <Box marginVertical="medium">
                        <Text>Hints:</Text>
                        <Hint>Hned to mažem</Hint>
                        <Hint variant="error">Please enter a valid address dumbo</Hint>
                    </Box>
                    <Box marginVertical="medium">
                        <Text>Radio:</Text>
                        <Box flexDirection="row" justifyContent="space-between">
                            <Radio
                                key="first"
                                value="first"
                                onPress={handleRadioPress}
                                isChecked={radioChecked === 'first'}
                            />
                            <Radio
                                key="second"
                                value="second"
                                onPress={handleRadioPress}
                                isChecked={radioChecked === 'second'}
                            />
                            <Radio
                                key="third"
                                value="third"
                                onPress={handleRadioPress}
                                isDisabled
                            />
                            <Radio
                                key="fourth"
                                value="fourth"
                                onPress={handleRadioPress}
                                isChecked
                                isDisabled
                            />
                        </Box>
                    </Box>
                    <Box marginVertical="medium">
                        <Text>Checkbox:</Text>
                        <Box flexDirection="row" justifyContent="space-between">
                            <CheckBox
                                isChecked={isCheckBox1Checked}
                                onChange={() => setIsCheckBox1Checked(!isCheckBox1Checked)}
                            />
                            <CheckBox
                                isChecked={isCheckBox2Checked}
                                onChange={() => setIsCheckBox2Checked(!isCheckBox2Checked)}
                            />
                            <CheckBox
                                isChecked={isCheckBox3Checked}
                                onChange={() => setIsCheckBox3Checked(!isCheckBox3Checked)}
                                isDisabled
                            />
                            <CheckBox
                                isChecked={isCheckBox4Checked}
                                onChange={() => setIsCheckBox4Checked(!isCheckBox4Checked)}
                                isDisabled
                            />
                        </Box>
                    </Box>

                    <NumPadButton
                        value={5}
                        onPress={value =>
                            console.warn('Press num pad button. No implementation yet.', value)
                        }
                    />
                    <Box marginVertical="medium">
                        <ListItem
                            iconName="warningCircle"
                            title="Some Really and I mean really really Long Headline"
                            subtitle="Description of that headlineDescription of that headlineDescription of that headlineDescription of that headline"
                            hasRightArrow={false}
                        />
                    </Box>
                    <Box marginVertical="medium">
                        <ListItem
                            iconName="placeholder"
                            title="Not wrapped example with long and I mean really long Headline"
                            subtitle="Description of that not wrapped example with long and I mean really long Headline"
                            hasRightArrow
                            isTextTruncated
                        />
                    </Box>
                    <Box marginVertical="medium">
                        <SelectableListItem
                            iconName="placeholder"
                            title="Headline"
                            subtitle="Description of that headline"
                            onPress={handleRadioPress}
                            value="firstSelectable"
                            isChecked={radioChecked === 'firstSelectable'}
                        />
                    </Box>
                    <Box marginTop="medium">
                        <Text variant="titleMedium">Icons</Text>
                        <Box flexWrap="wrap" flexDirection="row">
                            {Object.keys(icons).map((icon: string) => (
                                <Box
                                    key={icon}
                                    marginRight="large"
                                    marginBottom="large"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Icon name={icon as IconName} />
                                    <Text>{icon}</Text>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    <Box marginTop="medium">
                        <Text variant="titleMedium">Token Icons</Text>
                        <Box flexWrap="wrap" flexDirection="row">
                            {Object.keys(ethereumTokenIcons).map((icon: string) => (
                                <Box
                                    key={icon}
                                    marginRight="large"
                                    marginBottom="large"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <EthereumTokenIcon name={icon as EthereumTokenIconName} />
                                    <Text>{icon}</Text>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    <CoinsSettings />
                </Box>
            </VStack>
        </Screen>
    );
};
