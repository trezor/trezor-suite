# Videos in Suite

Videos in Suite can be encoded in `.mp4` container however we can also use WebM format which have benefits of smaller data footprint, better color accuracy and they also support **transparency**.

The designers should always provide `.mov` file with appropriate quality, pixel dimensions and a alpha channel (if e.g. transparent background is needed).

The following process is tested on **MacOS**:

## Prerequisites

Install encoder

```
brew install ffmpeg
```

## Encode videos using command line (recommended)

**WebM - currently supported by Chrome/Firefox**

```
ffmpeg -i source.mov -pix_fmt yuva420p -an encoded_file.webm
```

## Encode videos using desktop application

[Shutterencoder](https://www.shutterencoder.com/en/)

## Example usage

Encoded video files can be then saved to `suite-data` and linked using `resolveStaticPath()` function.

```js
<video loop autoPlay muted>
    <source src={resolveStaticPath(`videos/onboarding/encoded_file.webm`)} type="video/webm" />
</video>
```

## References

[How to make HEVC, H265 and VP9 videos with an alpha channel for the web](https://kitcross.net/hevc-web-video-alpha-channel/)

[Alpha transparency in Chrome video](https://developers.google.com/web/updates/2013/07/Alpha-transparency-in-Chrome-video)
