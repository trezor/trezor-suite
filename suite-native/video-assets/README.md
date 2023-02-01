# @suite-native/video-assets

This package is responsible for video compression and rendering.

## How to add or update icon

1. Put the desired MP4 video in the `assets/raw` folder.
2. Rename the source file to follow the camel case convention (e. g. Onboarding Bitcoin.mp4 => onboardingBitcoin.mp4).
3. Install [FFmpeg software](https://ffmpeg.org/download.html).
4. Run `yarn generate-videos` - This command uses FFmpeg to compress the source videos from the `raw` folder and places the result in the `compressed` folder. It will also regenerate the `src/vidoe.ts` file.
5. You can use your newly added videos 🎉. Example usage of the `Video` component:

    ```tsx
    <Video name="onboardingBitcoin" />
    ```
