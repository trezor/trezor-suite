import * as React from 'react';
import Svg, { G, Path, Defs, ClipPath, SvgProps } from 'react-native-svg';

import { useActiveColorScheme } from '@suite-native/theme';

export const BtcSvg = (props: SvgProps) => {
    const colorScheme = useActiveColorScheme();
    const lineColor = colorScheme === 'dark' ? '#74DCB1' : '#0F6148';
    const fillColor = colorScheme === 'dark' ? '#092519' : '#F0F9F6';

    return (
        <Svg width={139} height={156} fill="none" {...props}>
            <G clipPath="url(#a)">
                <Path
                    d="M108.64 9.304l11.513 7.24s11.948 9.87 15.161 20.465c3.212 10.6 5.948 27.537.877 46.307-5.07 18.768-17.32 39.027-31.747 51.912 0 0-11.453 12.009-24.867 16.218-13.413 4.21-21.853 5.176-33.765 1.456l-8.85-3.802-3.903-1.425-5.843-3.21 8.229 1.866L108.64 9.304z"
                    fill={fillColor}
                />
                <Path
                    d="M109.337 12.429s27.503 20.785 9.146 73.526c-18.358 52.739-61.16 60.267-61.16 60.267s-31.464 9.253-49.915-21.729c-18.448-30.982 4.29-70.35 7.86-76.8C18.84 41.243 41.02 6.54 73.54 1.905c0 0 18.358-5.828 35.798 10.524z"
                    fill={fillColor}
                />
                <Path d="M.676 99.78s.015-.022 0-.022a.01.01 0 000 .022z" fill={lineColor} />
                <Path
                    d="M3.598 75.68c-3.061 10.949-4.895 23.033-2.5 34.291 1.906 8.965 6.078 17.472 12.394 24.148 5.776 6.109 13.369 10.615 21.495 12.777 8.735 2.322 17.805 2.126 26.477-.372 10.154-2.926 19.426-8.724 27.464-15.491 8.534-7.184 15.737-15.847 21.522-25.374 10.844-17.85 18.002-39.455 15.197-60.512-1.412-10.587-4.944-20.999-11.683-29.402-6.126-7.64-14.759-13.133-24.42-14.933a42.585 42.585 0 00-7.113-.7c-.832-.012-.832 1.28 0 1.295a39.322 39.322 0 0126.288 10.617c7.161 6.698 12.358 16.627 14.219 26.628 1.861 10.001 1.101 20.196-.733 29.928-1.922 10.21-5.469 20.096-10.286 29.288-9.613 18.354-25.042 35.182-44.105 43.819-15.743 7.129-34.92 6.525-48.678-4.596-6.709-5.427-11.658-12.777-14.482-20.915-1.571-4.532-2.29-9.149-2.968-13.875-.79-5.511-.718-11.076.012-16.587.45-3.376 1.113-6.719 1.919-10.029.003-.012-.019-.018-.022-.006h.003z"
                    fill={lineColor}
                />
                <Path
                    d="M138.342 50.335c-.238-3.116-.368-6.12-1.248-9.131-.812-2.776-1.874-5.463-2.968-8.135-2.04-4.97-4.941-9.694-8.718-13.547-2.711-2.766-5.93-5.453-9.393-7.226-2.79-1.428-5.746-2.458-8.539-3.901-2.522-1.305-5.04-2.618-7.556-3.932-.54-.284-1.02.538-.48.821 1.952 1.021 3.901 2.045 5.852 3.071 1.605.843 3.252 1.643 4.814 2.561 1.34.788 2.558 1.752 3.906 2.522 2.815 1.606 5.569 3.234 7.964 5.462 4.033 3.75 7.076 8.045 9.866 12.758 1.638 2.766 2.787 5.683 3.704 8.764.471 1.576.748 3.24 1.312 4.783a34.62 34.62 0 011.472 5.136c0 .01.015.006.015 0l-.003-.006zM9.761 128.309c5.161 7.489 11.8 14.217 20.01 18.291 2.893 1.434 5.976 2.491 8.962 3.717 4.483 1.839 8.944 3.621 13.698 4.662 13.884 3.044 27.801-.993 39.67-8.367 5.36-3.331 10.386-7.329 14.983-11.647 4.624-4.345 9.064-9.138 12.56-14.452 7.776-11.813 14.108-24.831 17.573-38.574.206-.81-1.043-1.153-1.248-.344-2.971 11.792-7.867 23.801-15.197 33.576-7.369 9.829-15.579 19.308-25.744 26.325-11.176 7.716-23.95 13.272-37.774 12.124-5.424-.449-10.494-1.718-15.504-3.819-3.261-1.365-6.573-2.637-9.8-4.077-2.625-1.172-5.068-2.73-7.415-4.379-2.346-1.648-4.633-3.27-6.88-4.982-2.98-2.271-5.574-5.127-7.879-8.069-.006-.009-.024 0-.018.012l.003.003zM80.353 9.618s.015-.021 0-.021a.01.01 0 000 .02z"
                    fill={lineColor}
                />
                <Path
                    d="M91.83 115.847c13.384-14.198 22.562-32.476 24.797-51.962 1.807-15.754-1.26-33.012-13.266-44.26-4.965-4.653-11.202-7.857-17.92-9.005-7.212-1.229-14.608-.048-21.44 2.404-15.742 5.65-28.43 17.197-37.753 30.852-9.203 13.474-15.335 28.566-16.925 44.89a103.93 103.93 0 00-.443 7.568c-.006.278.425.278.431 0 .392-16.696 5.083-32.987 14.069-47.095 8.539-13.407 19.874-25.426 34.232-32.564 12.953-6.441 28.48-8.307 40.984.184C111.098 25.35 116.917 42 116.567 57.148c-.22 9.533-2.383 18.993-5.818 27.865-3.521 9.093-8.359 17.862-14.398 25.523a93.415 93.415 0 01-4.524 5.308c-.003.003 0 .009.006.006l-.003-.003z"
                    fill={lineColor}
                />
                <Path
                    d="M67.865 12.323C52.995 15.96 40.462 26.1 30.833 37.673c-9.628 11.576-17.373 26.626-20.662 42.06-2.567 12.051-2.175 25.033 3.357 36.239 4.555 9.228 12.325 16.131 21.996 19.601 11.423 4.095 23.947 2.431 34.646-2.944.247-.124.03-.499-.218-.372-9.6 4.823-20.692 6.668-31.174 3.85-9.652-2.594-17.914-9.246-22.993-17.81C9.68 108.002 8.5 95.664 10.283 84.002 12.56 69.1 18.949 54.635 27.766 42.466c5.19-7.16 11.561-13.631 18.614-18.958 6.488-4.9 13.58-9.089 21.488-11.176.003 0 0-.009 0-.006l-.003-.003zM53.637 8.775c-1.213.175-2.473.94-3.55 1.513-1.077.574-2.19 1.296-3.255 1.975a83.586 83.586 0 00-6.313 4.466 91.632 91.632 0 00-10.88 10.013c-3.258 3.512-6.353 7.163-9.061 11.116-2.896 4.224-5.137 8.727-7.424 13.299-.048.096.094.18.148.084 2.383-4.297 5.243-8.325 8.069-12.335 2.826-4.01 5.713-7.87 8.995-11.442a90.904 90.904 0 0110.415-9.717 81.495 81.495 0 016.53-4.672c1.069-.688 2.172-1.313 3.25-1.987 1.076-.673 2.33-1.265 3.172-2.159.07-.075 0-.172-.093-.16l-.003.006zm20.795-7.323c1.42.414 3.203.016 4.693.112 1.82.118 3.653-.051 5.481-.015 3.695.076 7.055 1.111 10.639 1.77.16.03.326-.176.175-.302C92.69.727 88.85.302 85.38.106 83.517 0 81.496-.103 79.647.208c-1.059.179-2.057.487-3.128.628-.748.1-1.439.124-2.105.478-.057.03-.042.117.018.135v.003zm63.494 73.934c-.739 1.643-1.215 3.186-1.601 4.959-.317 1.443-.972 3.228-.712 4.695.024.127.202.163.283.076 1.026-1.075 1.385-2.996 1.735-4.412.461-1.866.594-3.4.392-5.293-.006-.046-.076-.082-.1-.028l.003.004zm-30.978 57.782c-2.564-4.572-4.784-9.485-6.081-14.579l-.35.35c4.534 1.685 7.644 5.831 11.96 7.987.259.13.582-.141.413-.413a68.997 68.997 0 00-6.367-8.791l-.383.499c2.63 1.443 5.36 2.554 8.222 3.448.32.1.64-.296.447-.583-1.288-1.935-3.463-2.841-4.917-4.593-1.903-2.291-.833-5.423-1.759-7.996-.132-.365-.636-.383-.763 0-.724 2.223.055 5.267 1.367 7.142 1.538 2.198 4.018 3.551 5.387 5.846l.446-.583c-2.775-.882-5.48-1.987-8.114-3.231-.322-.151-.63.221-.383.498a54.616 54.616 0 016.292 8.649l.414-.414c-4.25-2.455-7.134-6.791-12.114-8.011-.202-.048-.416.136-.35.35 1.602 5.134 3.469 10.032 6.141 14.715.181.317.667.033.489-.287l.003-.003z"
                    fill={lineColor}
                />
                <Path
                    d="M106.918 108.123c.712.945 1.942 1.338 2.95 1.917 1.339.773 2.651 1.589 3.954 2.419 2.45 1.558 4.917 3.089 7.701 3.968.567.178 1.194-.547.817-1.063-1.327-1.824-2.44-3.744-3.903-5.478-.135-.16-.395.049-.289.224 1.092 1.787 2.304 3.784 2.868 5.813l.89-.891c-2.865-1.018-5.408-2.621-7.966-4.228-1.167-.733-2.338-1.485-3.575-2.101-1.007-.505-2.138-1.184-3.287-.976-.16.03-.26.263-.16.396zm8.588-2.987c-.751-1.63-1.53-3.225-2.495-4.737l-.703.914c1.225.393 2.434.855 3.638 1.308.588.223.962-.71.425-1.009-1.2-.667-2.41-1.129-3.731-1.5-.492-.14-1.019.456-.703.915 1.017 1.47 2.024 2.941 2.884 4.511.25.453.893.054.685-.399v-.003zm-35.482 46.262c-3.704-4.237-9.43-4.992-14.162-7.585-.796-.438-1.578.582-.962 1.247 1.11 1.202 2.247 2.397 3.233 3.705.987 1.307 1.81 2.745 2.751 4.095l1.008-.78a41.185 41.185 0 00-4.923-3.813c-1.01-.665-2.929-2.332-4.274-1.776-1.188.489-1.029 1.709-.392 2.57 1.333 1.796 2.935 3.234 3.484 5.499l.537-.946c-1.47.529-3.297-.785-4.588-1.404-1.101-.528-2.2-1.06-3.324-1.534-2.284-.963-4.522-1.742-7.022-1.754-.667-.003-1.023.716-.733 1.277.476.918.304 1.471.31 2.419.006.827.371 1.516.833 2.177l1.372-1.06c-1.411-1.162-3.025-2.204-4.524-3.282-1.623-1.169-3.258-2.208-5.047-3.107-.28-.142-.64.244-.359.468 1.37 1.087 2.76 2.129 4.15 3.188a74.19 74.19 0 012.414 1.918c.79.655 1.385 1.395 2.127 2.056.696.619 1.984-.205 1.372-1.06-.612-.854-.558-1.31-.537-2.273.018-.843-.262-1.565-.651-2.295l-.733 1.277c3.046-.018 5.764.975 8.478 2.262 1.946.921 4.628 2.877 6.863 2.216.422-.124.612-.528.537-.945a5.936 5.936 0 00-1.291-2.811c-.392-.483-.8-.958-1.204-1.429-.205-.238-1.252-1.132-1.24-1.428.049-1.567 1.961-.06 2.299.157.594.384 1.176.785 1.743 1.208 1.246.93 2.353 2.002 3.412 3.137.5.538 1.372-.151 1.007-.779-1.68-2.89-3.87-5.662-5.972-8.274l-.962 1.247c4.557 2.631 10.382 3.174 14.282 6.894.453.432 1.086-.217.679-.679l.009-.003zm53.275-118.707c-1.961-1.41-4.407-2.373-6.582-3.424-2.226-1.075-4.5-2.035-6.642-3.27l-.169 1.283c1.753-.622 3.312-1.498 4.811-2.591.26-.19.275-.535 0-.719-2.425-1.648-4.627-3.294-6.467-5.613l-.603 1.035c1.9.354 3.363.148 5.212-.308.269-.066.402-.465.172-.655-1.396-1.165-3.016-1.736-4.741-2.24-1.91-.556-4.872-1.015-5.837-2.99l-.395.975c.772-.202 1.541-.407 2.313-.61.685-.18.38-1.141-.286-1.038-.794.123-1.587.244-2.38.368-.579.09-.622.954-.16 1.214 1.653.93 3.113 1.766 4.953 2.307 2.099.619 4.277 1.102 5.978 2.567l.172-.655c-1.436.226-3.239.075-4.672-.13-.609-.088-1.026.537-.603 1.035 1.876 2.205 4.232 4.319 6.922 5.457v-.719c-1.568.7-3.173 1.317-4.766 1.957-.615.248-.712 1.142 0 1.353 2.513.749 4.878 1.893 7.261 2.986 2.072.952 4.135 2.199 6.298 2.917.307.103.44-.326.208-.492h.003zM91.782 48.553c-1.258-1.579-2.588-3.043-4.033-4.363-.078-.072-.226-.081-.329.033a217.79 217.79 0 00-5.797 6.764c-.53.647-1.973 2.881-2.697 3.032l-.678-.468c-.269-.356-.522-.818-.7-1.036-.36-.431-.715-.863-1.074-1.292 1.397-1.71 2.793-3.415 4.187-5.124.733-.894 1.466-1.788 2.202-2.673.696-.836 1.463-2.02 2.29-2.597.195-.139.261-.413.138-.574a127.495 127.495 0 00-3.662-4.417c-.057-.166-.232-.26-.392-.082-2.296 2.54-4.42 5.381-6.681 7.978a24.486 24.486 0 01-1.578 1.673c-.096.09-.23.269-.335.311a.669.669 0 00-.108.054c.003-.015-.006-.036-.073-.066-.063-.027-.323-.592-.407-.707l-.664-.909c-1.665-2.273-3.387-4.49-4.98-6.848-.226-.335-.636-.024-.715.335-.992.89-1.918 2.129-2.796 3.195a151.084 151.084 0 00-3.07 3.883c-.196.254-.118.559.048.664 1.032.662 2.295 1.504 2.944 2.83.268.797.467 1.79.326 2.754-.338 1.446-1.484 2.59-2.413 3.666-1.231 1.422-2.438 2.883-3.65 4.33-1.819 2.171-3.541 4.463-5.375 6.61-1.93 2.259-3.913 4.463-5.846 6.728-1.508 1.766-3.01 3.506-4.44 5.369 0 .003 0 .006-.006.009-.63.655-1.258 1.323-1.922 1.893-.965.493-1.87.601-2.551-.371a6.148 6.148 0 01-.32-.52c-.36-1.147-.712-2.829-1.96-1.709-1.15 1.036-2.447 2.138-3.608 3.355l-.06.052-.037.048a17.016 17.016 0 00-1.493 1.784c-.048.07-.078.197-.036.254 1.01 1.45 1.737 3.14 2.618 4.72.827 1.48 1.638 2.968 2.374 4.535-1.192.976-2.293 2.685-3.285 3.917-1.36 1.688-2.679 3.443-4.039 5.14-.117.145-.166.44-.081.564.953 1.413 1.78 2.987 2.79 4.33.133.179.413.052.567-.147a76.392 76.392 0 013.957-4.741c.947-1.048 2.187-2.06 2.974-3.319a13.888 13.888 0 011.865 2.914c-1.2 1.32-2.344 2.763-3.49 4.155-1.337 1.622-2.712 3.267-3.888 5.073-.103.157-.106.332-.018.441 1.046 1.301 2.036 2.666 2.874 4.206.115.209.386.197.564-.057 2.15-3.077 4.534-5.789 7.185-8.084.999 1.628 2.253 3.099 3.523 4.355 1.343 1.331 2.836 2.286 4.615 2.769 1.578.426 3.17.284 4.923-.462 1.813-.773 3.761-1.631 5.478-2.944.89-.68 1.84-1.178 2.696-1.93.878-.77 1.702-1.694 2.44-2.684.194-.257.378-.523.559-.792.02-.027.042-.054.063-.084 2.522-3.491 3.303-7.26 3.318-9.545.009-1.71-.45-3.75-.778-4.847.534.145 1.14.163 1.773.097.034 0 .067-.006.1-.01l.093-.008c.33-.034.658-.097.984-.19 1.297-.32 2.609-.907 3.607-1.501a17.174 17.174 0 002.468-1.794 10.37 10.37 0 001.146-1.084 20.223 20.223 0 003.49-4.868 33.85 33.85 0 00.772-1.628c.636-1.298 1.137-2.584 1.348-3.696.591-2.065.905-4.158.715-6.006-.335-3.246-1.493-6.586-3.095-8.887l-.093-.208.34-.438c.592-.57 1.3-1.35 1.388-1.455a53.854 53.854 0 002.431-3.108c.67-.915 1.36-2.008 2.1-3.032l.953-1.222c.269-.315.543-.613.83-.88.175-.123.389-.292.57-.473.16-.118.32-.23.482-.327.224-.13.275-.458.148-.618l-.003.005zM60.484 69.722c1.312-1.537 2.6-3.117 3.922-4.642 1.68-1.938 3.441-3.708 5.148-5.59 1.825 1.764 3.186 4.216 4.021 7.01.423 1.413.85 3.064.534 4.798-.344 1.884-1.662 3.63-2.902 4.922-1.073 1.12-2.322 2.038-3.577 2.117-1.436.09-2.805-.828-3.858-1.682-1.047-.849-2.02-1.821-2.739-3.099-.488-.872-.899-1.769-1.602-2.34.344-.501.691-1 1.047-1.494h.006zM48.865 97.37c-1.197-1.006-2.193-2.31-3.089-3.711-.467-.731-.904-1.495-1.345-2.253-.208-.356-.53-.64-.416-1.205v-.006s0 .003.003.006c.172-.426.841-1.054 1.128-1.41.47-.589.932-1.184 1.394-1.782.868-1.12 1.758-2.213 2.642-3.312l2.654-3.3c.546-.68 1.207-1.378 1.744-2.136a.76.76 0 01.214.046c.392-.173.646-.067.76.317.163.172.287.428.422.634.74 1.11 1.487 2.225 2.136 3.436.268.498.519 1.015.76 1.54.169.414.329.834.48 1.26 1.098 3.116 1.632 7.546-.82 11.19-2.664 3.962-6.501 2.51-8.67.689l.003-.003z"
                    fill={lineColor}
                />
            </G>
            <Defs>
                <ClipPath id="a">
                    <Path fill="#fff" d="M0 0h139v156H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
