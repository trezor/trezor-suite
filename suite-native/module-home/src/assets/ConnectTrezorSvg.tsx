import * as React from 'react';
import Svg, { G, Path, Defs, ClipPath, SvgProps } from 'react-native-svg';

export const ConnectTrezorSvg = (props: SvgProps) => (
    <Svg width={216} height={205} viewBox="0 0 216 205" fill="none" {...props}>
        <G clipPath="url(#clip0_21584_4732)">
            <Path
                d="M137.795 106.773l9.431 5.352 1.821.454s7.532 3.66 10.032 1.023c2.497-2.637 8.2-10.907 8.2-10.907s10.6-15.356 10.867-15.852c.267-.497 3.458-5.657 5.823-16.292l13.833-46.507 1.932-6.673s1.95-3.24-.79-5.056c-2.744-1.817-9.293-3.767-9.293-3.767s-5.73-1.052-15.02-.562c-9.293.488-11.841.11-14.554.425-2.713.314-6.914.643-8.957 9.902l-9.503 32.386s-4.42 14.426-4.844 19.317c-.342 3.94-1.574 20.265-2.019 27.324-.108 1.701-.117 4.963-.117 4.963s.739 2.616 3.161 4.47h-.003zM14.395 30.003l2.93 21.945 5.843 35.947 13.995 71.971 4.979 19.446s6.974 15.185 23.276 11.032c16.303-4.153 34.165-9.466 34.165-9.466l23.616-10.243s11.582-5.268 9.013-19.027c-2.569-13.759-6.892-35.824-6.892-35.824l-8.539-43.619-9.323-46.025-3.861-14.201S99.027-.101 84.608.966C70.186 2.033 41.475 5.277 41.475 5.277L28.36 8.19s-8.407 4.204-10.432 8.148c-2.025 3.943-3.527 9.603-3.533 13.666z"
                fill="#F0F9F6"
            />
            <Path
                d="M90.936 183.001c.1.398 3.807 7.275 3.807 7.275l2.905 1.097 4.408-.201 1-2.69-2.905-8.871-9.215 3.387v.003zM140.811 108.555l-1.502 4.783.799 3.49 1.704 1.593 1.803-.496 3.205-4.984-6.009-4.386z"
                fill="#F0F9F6"
            />
            <Path
                d="M47.592 4.954c7.337-.795 14.68-1.543 22.02-2.296 5.03-.517 10.09-1.103 15.15-1.026 4.716.072 9.26 1.023 13.138 3.815 4.519 3.253 6.337 9.146 7.506 14.316 2.541 11.223 4.801 22.516 7.054 33.806 4.059 20.354 8.04 40.72 12.039 61.088 1.746 8.897 3.486 17.798 5.24 26.696 1.061 5.378 2.62 10.584 1.443 16.073-1.118 5.217-4.267 9.666-8.672 12.68-2.812 1.925-5.952 2.978-9.13 4.144-7.536 2.765-15.155 5.31-22.682 8.096-.685.254-1.592.431-1.664 1.301-.1 1.169 1.73 1.163 1.83 0-.154 1.812-.719.669-.238.66.087 0 .27-.125.358-.164.372-.167.982-.398 1.448-.583 1.64-.643 3.29-1.25 4.951-1.839 4.408-1.563 8.822-3.106 13.226-4.679 3.152-1.127 6.376-2.173 9.441-3.531 4.633-2.051 8.746-5.896 11.005-10.416 1.725-3.451 2.503-7.352 2.32-11.197-.099-2.093-.589-4.12-1.001-6.165a7092.961 7092.961 0 01-4.951-24.947c-4.104-20.836-8.175-41.678-12.319-62.508-1.559-7.837-3.118-15.673-4.741-23.497-.796-3.848-1.797-7.666-2.545-11.52-.964-4.972-2.034-10.094-4.72-14.474-2.44-3.98-6.454-6.71-10.96-7.9C86.353-.636 79.999.12 74.154.802A619.908 619.908 0 0059.676 2.67c-4.053.568-8.103 1.157-12.15 1.76-.295.046-.228.557.072.524h-.006zM45.296 4.578c-4.29-.383-8.734.406-12.817 1.734-4.083 1.327-7.776 3.495-10.176 7.07-5.928 8.83-3.36 19.736-2.044 29.444 1.86 13.727 4.204 27.37 7.13 40.91 2.909 13.47 5.709 26.974 8.32 40.506 1.466 7.6 2.96 15.188 4.552 22.765 1.598 7.594 2.962 15.299 4.978 22.797.139.514.875.29.788-.215-1.127-6.533-2.633-13-3.807-19.527-1.175-6.526-2.293-13.167-3.483-19.741-2.376-13.123-4.608-26.26-7.385-39.305-2.77-13.02-5.558-26.029-7.817-39.151-1.106-6.413-2.065-12.848-3-19.288-.618-4.275-.747-8.323.5-12.524.853-2.87 1.974-5.753 4.176-7.866 1.767-1.698 3.993-2.891 6.262-3.794 4.473-1.78 9.287-2.072 13.88-3.376.256-.072.187-.418-.06-.44h.003zM45.642 171.63c1.283 7.535 6.177 15 13.587 17.811 8.277 3.139 17.58-.873 25.451-3.394.763-.245.433-1.264-.321-1.163-3.9.533-7.713 1.567-11.553 2.401-3.924.852-8.22 1.48-12.16.377-7.306-2.048-12.324-9.322-14.19-16.259-.144-.532-.904-.299-.814.224v.003z"
                fill="#0F6148"
            />
            <Path
                d="M114.801 76.874c3.557 18.403 7.166 36.796 10.768 55.189 1.073 5.475 2.251 10.94 3.224 16.432.79 4.47.168 9.314-1.971 13.335-4.492 8.434-14.425 10.904-22.9 13.508-.28.087-.16.526.12.437 7.463-2.407 16.089-4.407 21.227-10.809 3.278-4.087 4.618-9.373 4.206-14.542-.36-4.533-1.643-9.065-2.518-13.514-1.664-8.485-3.335-16.973-4.996-25.458-2.263-11.559-4.516-23.12-6.751-34.685-.051-.263-.457-.153-.406.11l-.003-.003zM50.284 7.95c7.665-.966 15.341-1.878 23.021-2.73 6.123-.678 13.067-1.698 19.025.443 2.737.983 5.348 2.667 7.145 4.963 2.112 2.7 3.32 6.015 4.197 9.286.898 3.352 1.565 6.817 2.22 10.225 1.196 6.222 2.239 12.471 3.438 18.693.051.263.456.152.405-.11-1.803-9.335-3.137-18.843-5.444-28.075-1.514-6.064-4.137-11.693-9.993-14.59-6.003-2.972-13.277-2.043-19.686-1.343-8.13.888-16.246 1.988-24.346 3.106-.072.01-.057.14.018.132zM47.715 8.04c-7.16.25-16.41 1.806-20.836 8.075-2.533 3.591-3.726 8.608-3.699 12.955.03 4.33.928 8.74 1.52 13.015a538.515 538.515 0 006.626 37.731c1.85 8.74 3.785 17.425 5.122 26.263 1.322 8.754 2.837 17.466 4.859 26.089.03.129.222.075.198-.054-1.578-7.758-3.14-15.49-4.236-23.332a330.822 330.822 0 00-3.753-21.533c-2.491-11.99-4.955-23.957-6.917-36.048-.934-5.753-1.715-11.523-2.535-17.293-.59-4.156-.625-8.073.663-12.127.848-2.67 1.944-5.256 3.988-7.235 1.715-1.663 3.854-2.82 6.078-3.669 4.164-1.588 8.566-2.054 12.937-2.73.063-.009.048-.113-.015-.11v.003zM49.557 168.094c1.34 6.7 5.697 13.505 12.379 16.001 7.556 2.826 16.032-1.064 23.333-2.948.19-.047.108-.328-.08-.29-7.11 1.483-14.942 5.125-22.27 3.005-6.99-2.024-11.64-9.119-13.157-15.822-.03-.131-.232-.075-.205.057v-.003zM13.779 32.099c4.918 37.178 12.216 73.923 19.44 110.71 2.036 10.38 3.932 20.821 6.33 31.127.174.75 1.238.412 1.133-.311-1.367-9.317-3.272-18.57-5.096-27.809-1.827-9.259-3.684-18.513-5.52-27.769-3.647-18.411-7.264-36.829-10.62-55.294-1.857-10.219-3.75-20.435-5.385-30.693-.024-.159-.303-.123-.282.038z"
                fill="#0F6148"
            />
            <Path
                d="M31.292 7.23c-3.96 1.106-7.776 2.52-10.981 5.193-3.41 2.843-5.424 6.868-6.235 11.179-.913 4.864-.538 9.866.033 14.746.571 4.88 1.394 10.309 2.84 15.203.132.448.925.389.856-.117-.631-4.753-1.4-9.441-1.782-14.228-.381-4.787-.808-9.334-.18-13.912.583-4.236 2.238-8.306 5.453-11.233 2.957-2.688 6.697-4.514 10.122-6.526.163-.096.058-.36-.129-.308l.003.003zM38.503 165.543c.322 2.607.382 5.146.953 7.735.52 2.356 1.22 4.715 2.268 6.897 1.848 3.848 4.711 7.412 8.52 9.475 6.644 3.594 15.441 1.929 22.27-.242.584-.185.346-1.079-.255-.918-3.458.918-7.018.984-10.576 1.056-3.557.071-7.093.015-10.176-1.591-3.62-1.884-6.247-5.208-7.983-8.823-1.06-2.209-1.87-4.485-2.566-6.829-.697-2.344-1.487-4.529-2.055-6.808-.054-.215-.43-.176-.4.054v-.006z"
                fill="#0F6148"
            />
            <Path
                d="M56.882 190.128a947.329 947.329 0 00-.97-3.952c-.06-.242-.397-.215-.47 0-.36 1.064-.717 2.129-1.078 3.193h.484a1218.36 1218.36 0 00-1.758-4.616c-.087-.23-.417-.254-.496 0-.444 1.477-.892 2.954-1.337 4.431h.505a558.57 558.57 0 00-1.157-7.406c-.033-.212-.342-.179-.396 0-.508 1.647-1.055 3.28-1.593 4.918l.403.054-.862-7.472c-.03-.248-.382-.331-.463-.062-.466 1.566-1.502 2.732-3.026 3.351l.313.311 1.875-7.041c.084-.314-.406-.448-.49-.134l-1.875 7.041c-.045.167.126.388.313.311 1.682-.697 2.839-1.971 3.34-3.717l-.462-.063.92 7.472c.026.221.33.287.402.054.526-1.642 1.04-3.286 1.592-4.918H50.2c.336 2.481.682 4.96 1.051 7.435.04.269.436.224.505 0l1.328-4.434h-.496c.59 1.537 1.178 3.077 1.77 4.614.087.227.403.245.484 0l1.064-3.196h-.47c.388 1.3.785 2.598 1.175 3.895.052.168.307.099.265-.072l.006.003zM21.146 14.749c-3.251 3.671-5.102 8.165-5.724 13-.05.409.547.499.733.197 1.115-1.8 2.233-3.597 3.347-5.397l-.703-.296c-1.496 4.335-2.992 8.67-4.492 13.006-.114.335.376.628.61.353 1.713-2.019 3.417-4.043 5.114-6.073l-.51-.391c-2.74 5.57-4.357 11.84-3.585 18.067.045.353.577.377.57 0-.116-6.153.731-12.204 3.576-17.742.16-.307-.255-.684-.51-.391-1.731 2-3.456 4.006-5.171 6.018l.61.353c1.508-4.332 3.02-8.661 4.53-12.994.148-.421-.48-.651-.703-.296-1.12 1.797-2.241 3.591-3.362 5.388l.733.197c.61-4.646 2.488-8.984 5.183-12.808.102-.146-.129-.326-.25-.191h.004zM21.023 56.777c1.65 9.645 3.266 19.296 4.975 28.93.848 4.765 1.692 9.53 2.54 14.296.846 4.766 1.55 9.771 2.682 14.564.07.287.568.233.529-.072-.586-4.721-1.607-9.409-2.455-14.088-.88-4.858-1.764-9.717-2.644-14.575-1.76-9.711-3.617-19.407-5.441-29.11-.024-.122-.207-.068-.186.052v.003zM32.086 117.467c1.475 8.694 2.836 17.41 4.5 26.071.09.476.812.272.728-.2-1.518-8.67-3.336-17.287-5.042-25.925-.024-.122-.207-.069-.186.051v.003zM53.252 16.055c-.309-1.02-.745-1.725-1.811-2.098a2.843 2.843 0 00-2.728.472c-1.755 1.387-1.548 4.04.36 5.175 1.908 1.136 4.495-.101 4.886-2.305.177-.992-.16-2.176-1.115-2.667-.844-.433-1.878-.194-2.227.703-.189.487.412.762.785.6 1.658-.714 1.433 1.585.63 2.336-.916.86-2.382.643-3.061-.407-.565-.87-.225-2.057.616-2.619.961-.64 2.632-.137 3.074.966.14.353.703.221.585-.162l.006.006zM58.796 16.352c1.544.203 3.17-.144 4.711-.314l4.122-.455c2.948-.323 5.89-.673 8.834-1.014.92-.107.931-1.557 0-1.45-3.251.377-6.502.754-9.753 1.134-1.577.182-3.152.364-4.729.55-1.577.185-3.104.242-4.555.822-.358.143-.496.795 0 .87 2.969.44 6.319-.425 9.281-.771l9.753-1.149v-1.45c-3.044.36-6.087.712-9.128 1.089l-4.417.547c-1.403.173-2.911.224-4.24.73-.483.185-.378.798.118.864l.003-.003z"
                fill="#0F6148"
            />
            <Path
                d="M51.582 16.587c.51-.61.598-1.485-.195-1.913-.86-.463-1.674.182-2.05.936-.438.882-.793 2.09-.138 2.95.656.862 1.737.64 2.416-.03.712-.702 1.382-1.823 1.118-2.854-.264-1.032-1.262-1.468-2.23-1.143-1.658.563-3.34 3.75-.87 4.423 1.009.274 1.961-.276 2.58-1.041.619-.765 1.32-1.845.832-2.81-.46-.91-1.547-.93-2.181-.2-.634.729-1.12 2.212-.853 3.145.297 1.034 1.544.995 2.145.275.6-.72.796-1.956.033-2.62-1.746-1.518-3.819 2.503-1.998 3.194 1.07.406 2.085-1.053 2.22-1.959.15-1.022-.76-1.958-1.79-1.495-1.03.464-.959 1.84-.018 2.335 1.174.62 2.175-.591 2.145-1.677-.015-.505-.652-.801-1.022-.421-.447.46-.868 1.16-.438 1.784.351.512.982.512 1.42.13.482-.425-.131-1.047-.636-.823.22.003.387-.078.502-.248l-1.022-.422c.06.194.015.353-.135.476-.087.194-.135.22-.147.086-.03-.146-.033-.098-.012.144l-.097.25c-.09.22-.504.919-.405.315.057-.344.484-1.19.754-.643.16.323-.33 1.37-.42.634-.046-.359.177-.864.306-1.193.03-.078.396-1.082.724-.398.069.144-.138.518-.201.64-.334.646-.92 1.57-1.755 1.552-1.331-.03-.49-1.525.021-2.003.337-.317.94-.772 1.376-.344.322.317.204.831.036 1.199-.168.367-.45.843-.766 1.1-.823.67-1.145-.332-1.007-.98.076-.356.199-.742.382-1.06.108-.187.27-.42.499-.483.556-.159 1.117.502.733 1.082-.057.084.075.188.141.107l.003.003z"
                fill="#0F6148"
            />
            <Path
                d="M49.866 14.36c.97.099 2.062-.075 2.768.777.567.682.315 1.349.174 2.111-.066.347.318.583.592.341.802-.705.495-2.176-.145-2.88-.775-.854-2.445-1.219-3.46-.624-.136.08-.064.26.074.275h-.003zM136.452 146.926c2.424 4.796 2.761 10.59 1.231 15.705a19.973 19.973 0 01-3.238 6.345c-1.458 1.919-3.399 3.318-4.958 5.121-.391.452-.03 1.295.631 1.077 2.383-.787 4.324-2.868 5.805-4.808a22.052 22.052 0 003.647-7.217c1.635-5.675.445-11.565-2.557-16.549-.216-.359-.745-.045-.558.326h-.003zM1.52 34.072a25.221 25.221 0 01.782-10.234 23.596 23.596 0 011.905-4.685c.72-1.336 2.22-2.772 2.502-4.249.102-.535-.39-.876-.868-.663-1.442.63-2.37 2.762-3.053 4.09a25.924 25.924 0 00-1.977 5.1c-.952 3.534-1.04 7.2-.396 10.794.11.612 1.187.478 1.105-.15v-.003zM23.084 3.612c-6.06 3.59-10.82 9.137-13.544 15.606-2.96 7.03-3.978 16.146-1.049 23.36.322.792 1.475.508 1.304-.359-.754-3.827-1.466-7.537-1.277-11.463.177-3.701.977-7.39 2.386-10.823 2.58-6.296 7.06-11.66 12.607-15.598.435-.308.05-1.007-.427-.726v.003zM146.192 35.986c1.701-4.94 2.936-10.04 4.384-15.057 1.169-4.048 2.073-9.777 6.658-11.382 2.566-.9 5.565-.787 8.248-.897 2.92-.117 5.838-.153 8.761-.129 2.923.024 5.856.099 8.785.156 2.44.044 7.5-.805 7.59 2.744.039 1.546-.658 3.128-1.112 4.605-.484 1.578-.964 3.16-1.445 4.738-1.578 5.19-3.083 10.402-4.618 15.604-3.068 10.387-6.102 20.782-9.248 31.145-1.178 3.881-2.133 7.81-3.903 11.487-1.833 3.81-4.378 7.331-6.667 10.874-3.233 5.002-6.586 9.917-9.855 14.895-.977 1.486-1.959 2.966-2.92 4.458-.601.933-1.133 2.129-2.302 2.425-1.463.371-2.962-.927-4.146-1.618l-4.008-2.341c-1.127-.657-2.404-1.19-3.462-1.955-1.285-.933-1.613-2.449-1.817-3.926-.105-.765-1.379-.58-1.349.183.102 2.523.859 4.389 2.995 5.833 2.599 1.758 5.405 3.253 8.118 4.829 2.026 1.172 4.336 1.65 6.142-.219.646-.669 1.066-1.525 1.547-2.314 2.713-4.425 5.357-8.898 8.133-13.284 2.777-4.386 5.838-9.181 8.75-13.78 2.608-4.123 3.9-8.622 5.315-13.218 3.091-10.048 6.102-20.124 9.167-30.182 1.763-5.791 3.533-11.58 5.297-17.37.558-1.84 1.102-3.681 1.658-5.523.427-1.414.98-2.855 1.166-4.317.237-1.872-.325-3.788-2.181-4.59-1.037-.448-2.218-.43-3.326-.433a914.588 914.588 0 00-4.961 0c-6.24.015-12.49.072-18.718.49-2.365.159-5.012.203-7.109 1.444-1.475.873-2.497 2.228-3.218 3.752-2.109 4.464-3.074 9.607-4.399 14.34-.787 2.81-1.628 5.603-2.334 8.434-.063.251.303.347.387.108l-.003-.01z"
                fill="#0F6148"
            />
            <Path
                d="M145.252 39.331c-.303.703-.769 1.333-1.072 2.051-.304.718-.604 1.462-.896 2.195a112.314 112.314 0 00-1.782 4.9c-1.12 3.28-2.085 6.616-3.031 9.95-1.079 3.797-2.169 7.612-2.56 11.547-.691 6.993-1.079 14.052-1.547 21.066-.163 2.434-.727 5.262-.181 7.669.081.359.592.32.694 0 .625-1.98.523-4.222.673-6.276.271-3.63.508-7.259.77-10.889.261-3.63.616-6.867.922-10.303.306-3.435 1.004-6.392 1.926-9.627 1.058-3.704 2.073-7.418 3.176-11.11a250.996 250.996 0 001.529-5.268c.255-.927.508-1.857.754-2.784.274-1.022.37-2.11.64-3.115 0-.012-.015-.018-.018-.009l.003.003zM197.336 11.098c1.4.792 2.818 1.698 2.845 3.49.012.962-.303 1.91-.604 2.813-.078.236-.165.472-.24.708-.385 1.19-.727 2.392-1.094 3.588-1.352 4.446-2.728 8.886-4.053 13.338-3.155 10.604-6.58 21.126-9.723 31.737-.541 1.826-1.115 3.644-1.61 5.483a6.75 6.75 0 00-.265 1.698c0 .15-.012.299-.012.445 0 .32-.072.38.009.102-.153.505.643.724.794.218-.043.14-.247.395.024-.006.072-.104.129-.218.201-.323.282-.418.49-.837.655-1.315.532-1.537.958-3.115 1.424-4.673a809.772 809.772 0 004.336-15.102c2.926-10.542 6.111-21.015 9.163-31.521.367-1.265.761-2.527 1.094-3.803.231-.88.466-1.764.529-2.673.174-2.443-1.259-3.627-3.47-4.228-.012-.003-.018.012-.009.018l.006.006zM182.572 76.432c-.857.577-.734 1.596-1.013 2.517-.496 1.639-1.25 3.307-2.103 4.79a77.531 77.531 0 01-4.204 6.53c-1.601 2.24-3.16 4.511-4.744 6.766-2.142 3.049-4.227 6.144-6.523 9.08-.964 1.235-1.838 2.55-2.707 3.854-.538.807-.949 1.545-1.457 2.066-1.941 1.994-4.095 1.719-6.634 1.249-1.415-.263-2.803-.311-4.209-.654-.604-.147-1.584-.344-1.998-.449-.697-.176-.998.897-.298 1.074.544.137 1.079.316 1.632.445 1.286.299 2.445.747 3.695 1.112 2.245.655 4.687 1.083 6.881.075 2.376-1.094 3.632-3.355 5.035-5.427 2.203-3.249 4.285-6.568 6.523-9.8 1.59-2.293 3.185-4.587 4.765-6.889 1.689-2.457 3.371-4.852 4.724-7.52.784-1.545 1.388-3.183 1.853-4.852.322-1.157 1.343-2.804.809-3.964-.006-.01-.021-.012-.03-.01l.003.007z"
                fill="#0F6148"
            />
            <Path
                d="M140.979 52.806c3.768 1.62 7.998 2.338 11.964 3.325 6.235 1.552 12.46 3.172 18.725 4.595a67.81 67.81 0 004.87.918c.226.033.325-.31.096-.344-1.28-.19-2.584-.77-3.836-1.103-2.753-.73-5.529-1.378-8.293-2.057-6.228-1.525-12.436-3.166-18.688-4.592a78.253 78.253 0 00-4.763-.915c-.096-.015-.18.125-.072.173h-.003z"
                fill="#0F6148"
            />
            <Path
                d="M176.709 61.767c2.963.944 6.043 2.012 9.107 2.562.436.078.607-.514.184-.66-2.945-1.026-6.139-1.559-9.143-2.429-.343-.098-.481.422-.148.527zM146.883 59.916c2.515 1.343 5.649 1.875 8.377 2.631 3.026.838 6.033 1.725 9.05 2.596 1.268.364 2.731.657 3.329 1.93.733 1.559-.61 3.711-2.392 3.547-1.262-.117-2.563-.646-3.779-.978-3.314-.903-6.637-1.788-9.942-2.73-1.785-.508-3.564-1.031-5.349-1.536-1.258-.36-2.532-.885-3.833-1.04-.325-.04-.415.442-.16.588 1.175.673 2.623.954 3.909 1.364 1.842.583 3.696 1.115 5.547 1.665 3.677 1.094 7.355 2.206 11.074 3.16 1.41.362 3.065 1.05 4.39.144 1.325-.906 2.266-3.098 1.565-4.593-.814-1.74-3.079-2.006-4.735-2.436-1.655-.43-3.413-.885-5.113-1.349-2.242-.61-4.462-1.285-6.704-1.898-1.664-.455-3.473-1.068-5.209-1.128-.037 0-.049.048-.019.066l-.006-.003z"
                fill="#0F6148"
            />
            <Path
                d="M143.882 64.834c-.523-.499-1.214-.55-1.818-.927-1.004-.624-1.502-1.901-1.112-3.028.445-1.28 1.271-1.683 2.563-1.483.766.12 1.43.41 2.209.299.162-.024.153-.245.042-.32-.67-.446-1.509-.511-2.287-.685-.454-.101-.874-.212-1.331-.078-.976.29-1.746 1.42-1.995 2.353-.523 1.95 1.397 4.9 3.66 4.138.111-.038.165-.182.072-.269h-.003zM154.058 61.746c-.745.493-.781 1.644-1.033 2.46-.343 1.095-.712 2.171-.77 3.325-.003.078.109.105.145.039.546-.948.829-1.961 1.171-2.993.286-.858 1.019-1.847.716-2.738-.031-.09-.139-.15-.229-.093zM164.703 64.799c.313.606 1.725.819 2.299.995 1.728.538 3.575 1.298 2.728 3.534-.396 1.044-1.145 1.968-2.334 1.953-.502-.007-.944-.12-1.428-.243-.558-.143-1.511-.592-2.073-.334-.153.071-.198.296-.114.43.415.67 2.124.918 2.866 1.052 2.035.374 3.459-.621 4.078-2.589.531-1.689-.027-3.11-1.698-3.79-.877-.36-3.398-1.633-4.308-1.062-.019.012-.022.03-.012.048l-.004.006zM188.854 25.605c-.183-.709-.343-1.42-.394-2.153-.045-.619-.216-.783.274-.511.318.176.658.837.883 1.103.352.416.718.82 1.091 1.217 1.619 1.722 3.371 3.3 5.213 4.784.225.179.607-.048.429-.33-1.274-2.014-2.208-4.17-3.073-6.383a50.188 50.188 0 00-1.031-2.496c-.547-1.205-1.667-2.625-1.731-3.958l-.42.173c2.37 2.194 5.339 3.6 7.682 5.85.253.243.643-.062.481-.367-2.256-4.266-4.774-8.452-6.258-13.068l-.463.266c2.485 3.064 4.837 6.35 7.611 9.17.261.266.624-.07.486-.374-1.105-2.434-1.64-5.095-2.773-7.525l-.388.298c1.398 1.337 2.548 2.954 3.648 4.536.141.203.475.138.478-.129.012-1.169-.881-2.828-1.584-3.728-.171-.221-.559.072-.393.302.607.834 1.454 2.389 1.463 3.426l.478-.128c-1.151-1.594-2.344-3.235-3.741-4.625-.21-.21-.496.053-.388.299 1.088 2.451 1.551 5.14 2.665 7.588l.487-.374c-2.797-2.843-5.15-6.03-7.658-9.122-.175-.215-.544.018-.463.266 1.493 4.628 3.879 9.005 6.264 13.227l.481-.368c-2.413-2.191-5.384-3.522-7.767-5.767-.147-.14-.429-.048-.42.174.042.983.498 1.668.964 2.517.715 1.306 1.307 2.676 1.875 4.051.922 2.233 1.734 4.482 3.02 6.545l.429-.33c-2.839-2.31-5.24-4.98-7.857-7.519-.072-.068-.186-.014-.189.078-.066 1.211.042 2.294.556 3.403.009.02.045.006.039-.015l-.006-.003zM189.091 8.455c.132.192.28.338.442.503.204.203.429.31.691.427.694.314 1.13-.717.405-.96-.273-.09-.519-.176-.811-.161-.234.012-.444.015-.679.069-.051.012-.081.08-.051.122h.003z"
                fill="#0F6148"
            />
            <Path
                d="M189.449 8.572c1.127 1.169 3.245 1.453 4.747 2.006 1.767.652 3.527 1.468 5.228 2.263.502.236.928-.457.442-.75-1.656-.996-3.221-2.024-5.027-2.754-1.523-.616-3.642-1.552-5.282-1.163-.18.042-.225.272-.105.398h-.003zM203.703 16.693c.018 0 .018-.03 0-.03-.019 0-.019.03 0 .03zM158.608 10.675c.018 0 .018-.031 0-.031-.019 0-.019.03 0 .03zM172.786 14.63l2.415.06-.231.917-1.992 2.556 1.331.054-.279 1.112-2.443-.107.243-.936 1.986-2.544-1.313-.04.283-1.073zM180.45 17.808c.358-.159.793-.595.974-1.382.219-.95-.109-1.572-.797-1.587l-1.559-.04-1.124 4.698.869.039.378-1.603.331.012.24 1.633 1.019.044-.334-1.814h.003zm-.399-.957l-.598-.021.222-.945.598.018c.225.006.33.2.267.475-.069.296-.264.482-.489.476v-.003zM177.028 14.668c-.982-.024-1.923.963-2.265 2.326-.346 1.375.105 2.434 1.081 2.479.986.044 1.98-.97 2.314-2.362.334-1.382-.141-2.416-1.13-2.44v-.003zm-.913 3.701c-.496-.02-.694-.577-.502-1.348.192-.771.658-1.295 1.151-1.283.493.012.715.565.526 1.34-.19.777-.676 1.312-1.175 1.291zM170.157 14.566l2.235.054-.274 1.053-1.445-.042-.18.666 1.406.045-.273 1.04-1.409-.047-.196.735 1.452.057-.283 1.077-2.259-.099 1.226-4.539zM169.378 16.058c.247-.903-.021-1.492-.643-1.507l-1.412-.032-1.25 4.463.784.033.421-1.522.298.012.138 1.55.919.038-.21-1.72c.33-.152.748-.564.949-1.312l.006-.003zm-1.265.407l-.54-.018.249-.9.541.015c.204.006.288.188.219.452-.075.28-.261.457-.466.45h-.003zM164.598 14.432l2.386.057-.295 1.046-.823-.024-.97 3.418-.772-.033.976-3.405-.799-.024.297-1.035zM162.585 13.762c.31-1.043-.036-1.91-.76-1.92-.724-.008-1.571.832-1.887 1.864l-.186.606-.538-.011-1.361 4.421 1.46 1.45 2.317-1.282 1.322-4.479-.553-.012.189-.634-.003-.003zm-1.977-.042c.147-.487.55-.873.914-.867.363.006.531.404.384.894l-.183.61-1.298-.03.183-.607zm.472 4.402l-1.376.765-.878-.855.815-2.67 2.238.066-.802 2.697.003-.003zM164.135 26.508c-6.012-.604-10.467 6.778-11.354 11.881-.886 5.104 1.433 10.605 6.842 11.933 5.627 1.381 11.195-2.715 13.917-7.328 2.722-4.614 3.203-11.711-1.385-15.395-2.461-1.976-5.646-2.15-8.635-1.441-2.632.625-6.511 2.266-7.29 5.113-.168.619.55.908.989.574.889-.685 1.595-1.546 2.542-2.174a12.112 12.112 0 013.458-1.555c2.151-.6 5-.944 7.046.14 4.365 2.318 4.398 8.88 2.602 12.78-1.911 4.143-6.262 8.168-11.093 8.126-4.831-.042-8.121-4.488-7.779-9.131.421-5.675 4.84-11.194 10.201-13.108.231-.08.183-.388-.058-.412l-.003-.003z"
                fill="#0F6148"
            />
            <Path
                d="M170.694 33.5c-.604-.445-1.217.09-1.772.682-.706.497-1.37 1.166-2.004 1.737-.731.658-1.458 1.31-2.182 1.959-.85.765-1.697 1.528-2.539 2.284-.252.132-.504.27-.754.404-.174-.114-.18-.518-.255-.766-.421-1.369-1.1-2.544-1.818-3.656-.006-.012-.015-.018-.024-.027.132-.329-.144-.688-.454-.4-.664.612-1.358 1.237-1.859 2.014a.197.197 0 00-.018.177c.585 1.184 1.138 2.416 1.736 3.626.388.78.799 2.019 1.683 2.288.997.302 2.052-.867 2.869-1.582 1.307-1.142 2.593-2.251 3.981-3.325a65.073 65.073 0 001.926-1.527c.646-.542 1.427-1.065 2.016-1.68.835-.87.063-1.768-.532-2.207zm-10.516 9.523a2.244 2.244 0 01-.231-.266c.075.093.15.183.231.266zM91.579 183.608c-.262 1.151.408 2.236.922 3.244.658 1.289 1.352 2.61 2.118 3.842.547.882 1.208 1.36 2.263 1.429 1.454.096 3.022.242 4.476.155 2.326-.143 2.879-1.865 2.431-3.904-.334-1.519-.778-3.032-1.235-4.521-.396-1.297-.553-2.885-1.749-3.668-.411-.269-.883.021-1.033.418-.367.966.057 1.752.345 2.706.289.954.553 1.872.824 2.81.27.939.838 2.159.886 3.17.057 1.249-1.692.998-2.599 1.076-.907.078-2.373.472-3.04-.332-.58-.697-.929-1.8-1.338-2.613-.694-1.378-1.376-3.396-2.908-4.012-.144-.057-.33.062-.363.206v-.006zM140.057 109.571c-.489 1.698-1.727 3.333-1.667 5.16.051 1.609 1.102 2.7 2.313 3.63 1.614 1.238 2.182.879 3.555-.532.763-.787 1.457-1.636 2.154-2.479.526-.637.991-1.079.769-1.925a.318.318 0 00-.297-.228c-1.205-.05-1.788 1.259-2.452 2.105-.379.485-.76.963-1.103 1.468-.297.437-.39.703-.907.942-.694.323-.784.102-1.427-.451-2.647-2.282-.262-4.838-.271-7.606 0-.38-.559-.455-.664-.09l-.003.006zM87.05 78.267c-1.078-5.74-7.075-9.65-13.285-8.613-6.21 1.037-10.417 6.655-9.338 12.395l.63 3.358-4.657.78 4.537 24.152 17.334 4.587 14.608-9.927-4.52-24.04-4.656.78-.652-3.466v-.006zm-16.858 2.82c-.508-2.706 1.524-5.28 4.63-5.8 3.107-.52 5.952 1.237 6.463 3.946l.631 3.358-11.093 1.853-.63-3.357zm19.52 21.087l-8.724 5.926-10.351-2.736-2.728-14.512 19.076-3.19 2.728 14.512z"
                fill="#0F6148"
            />
            <Path
                d="M99.595 191.815c2.166 8.682 12.637 10.515 20.127 12.016 9.534 1.907 19.488 1.193 29.051-.117 10.576-1.447 20.69-4.299 30.31-8.936 4.928-2.377 9.66-5.137 14.194-8.192 4.356-2.936 9.115-6.052 12.502-10.115 2.818-3.381 4.801-8.049 2.992-12.36-1.607-3.833-5.429-6.129-9.149-7.6-6.021-2.38-12.054-4.733-18.072-7.125-5.285-2.102-11.721-4.042-14.873-9.161-1.505-2.442-2.106-5.486-.805-8.15 1.163-2.38 3.485-4.048 5.931-4.957 4.492-1.668 9.675-.894 13.71 1.582 4.621 2.837 7.983 8.512 6.592 14.001-.956 3.767-4.306 6.15-7.803 7.418-8.16 2.963-16.567 1.384-24.232-2.174-9.218-4.275-19.454-11.777-20.401-22.714a15.734 15.734 0 011.199-7.537c.361-.855-1.135-1.492-1.517-.637-2.118 4.733-1.953 10.007.09 14.746 2.043 4.739 5.808 8.557 9.939 11.642 4.315 3.223 9.194 5.723 14.275 7.511 3.885 1.366 7.727 2.206 11.862 2.081 6.82-.204 16.131-2.619 17.985-10.213 2.437-9.98-7.737-18.325-17.036-18.116-4.552.102-9.584 2.246-11.76 6.44-2.298 4.434-.282 9.666 3.191 12.863 4.291 3.952 10.441 5.644 15.768 7.716 3.23 1.256 6.454 2.524 9.681 3.791 2.788 1.095 5.699 2.042 8.301 3.54 4.33 2.494 7.067 6.569 5.363 11.619-1.871 5.549-7.382 9.202-11.955 12.425-9.332 6.575-19.577 11.885-30.421 15.521-5.231 1.755-10.675 3.244-16.137 4.075-5.61.855-11.375 1.028-17.039.831-4.675-.165-9.218-.628-13.782-1.624-4.014-.876-8.446-1.71-11.952-3.955-2.368-1.516-4.299-3.719-5.255-6.374-.192-.539-1.01-.329-.868.239h-.006zM212.692 158.413c2.383 2.78 1.98 7.561 1.409 10.907-.655 3.818-2.238 7.429-4.158 10.775-.298.52.456 1.157.862.664 2.836-3.447 4.408-7.585 4.985-11.986.507-3.875.297-7.906-2.921-10.537-.126-.101-.285.054-.18.18l.003-.003z"
                fill="#0F6148"
            />
            <Path
                d="M164.361 126.637c-3.732-.108-5.153 3.976-4.723 7.08.069.508.865.451.976 0 .607-2.431.847-5.684 3.846-6.336.43-.092.315-.732-.102-.744h.003z"
                fill="#0F6148"
            />
        </G>
        <Defs>
            <ClipPath id="clip0_21584_4732">
                <Path fill="#fff" d="M0 0H216V205H0z" />
            </ClipPath>
        </Defs>
    </Svg>
);
