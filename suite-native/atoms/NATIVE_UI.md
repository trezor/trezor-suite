# Native UI

Shared atoms use Expo UI's SwiftUI and Jetpack Compose controls where they can preserve the
existing component contract. Platform files implement the controls; compatible React Native
implementations remain available for unsupported props and tests.

## Controls

| Component          | Native behavior                                                              | Compatibility path                                                                                    |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Button`           | Native button interaction and background, existing React Native label layout | Custom gestures, responder props, hit slop and press timing                                           |
| `IconButton`       | Native circular control with the existing icon                               | Explicit `native` opt-in; custom gesture or animated style props use the original control             |
| `TextButton`       | Native text and pressed feedback for plain or translated text                | Explicit `native` opt-in; icons, rich children, loading and dotted underline use the original control |
| `Switch`           | SwiftUI switch or Material switch                                            | Custom interaction props use the compatible implementation                                            |
| `CheckBox`         | SwiftUI check button or Material checkbox                                    | Custom interaction props use the compatible implementation                                            |
| `Radio`            | SwiftUI selection button or Material radio button                            | Custom interaction props use the compatible implementation                                            |
| `SegmentedControl` | Material single-choice segmented buttons on Android                          | iOS and rich labels retain the existing controlled implementation                                     |

Selection rows own their accessible role, checked state and press action. Their inner
`RadioIndicator` or decorative toggle does not add another accessible or interactive element.
Native buttons expose disabled and busy state through the existing accessible React Native
wrapper. Native callback APIs do not manufacture React Native gesture events.

## Bottom sheets

Ordinary content-sized `BottomSheetModal` presentations use native sheets. The shared coordinator
serializes replacement, nested presentation and dismissal. Opening callbacks wait for both React
Native content layout and the native presentation-ready event. `Input` and `SearchInput` defer
automatic focus until that event; they use ordinary React Native inputs inside native sheets.

The scrollable body shrinks above the keyboard while the header and footer remain outside it.
Keyboard height comes from React Native keyboard events: the Android dialog does not report its
keyboard through the activity's keyboard-controller state.

The original Gorhom implementation remains active for custom animated handles, backdrops,
keyboard/animation overrides, disabled pan dismissal, shared snap-point values and mixed dynamic
and fixed sizing. Exact fixed snap points are supported natively on iOS only; Material's partial
and expanded states do not represent arbitrary percentages or heights. `BottomSheetFlashList`
still uses its existing implementation.

The presentation-ready event is provided by the documented [Expo UI patch](../../.yarn/patches/README.md).
It changes native code and requires a new development build. Follow the
[app setup](../app/README.md); a Metro reload alone does not install the event. App autolinking
explicitly builds the patched Expo UI sources on both platforms.

## Text fields

`NativeTextInput` uses a native single-line field and native text state. `NativeTextInputField`
connects it to React Hook Form for plain URL/path fields, validation, blur and external resets.
The caller must accept native edits without filtering or formatting them; unchanged `value`
cannot be used to reject an edit. Accepted typing is not echoed into the native buffer, preserving
IME composition and selection. The form adapter keeps `valueTransformer` fields on `TextInputField`.

Use existing inputs when a field needs an imperative React Native ref, rich adornments, multiline
editing, secure entry or JavaScript text transformation. Those contracts are not simulated by
the new native field API.

## Runtime checks

Storybook's `Atoms/Native sheet QA` provides local synthetic fields, short and long content,
keyboard-height diagnostics, footer press and dismissal counters. It supports presentation-callback
focus, `autoFocus` and manual focus. Use it to check keyboard opening, the IME Next action,
scrolling to the lower field, footer reachability and close/backdrop/swipe/reopen behavior without
submitting real form data.

The `Lifecycle` story exercises nested sheets, closing a parent beneath its child, replacing both
with a sibling and reopening. Its counters should increment once for each dismissed sheet.
