import React from 'react';

const Facebook = ({ sizeMultiplier = 1 }: { sizeMultiplier: number }) => {
    const base = 20;
    return (
        <React.Fragment>
            <svg
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width={`${base * sizeMultiplier}px`}
                height={`${base * sizeMultiplier}px`}
                viewBox="0 0 266.893 266.895"
                enableBackground="new 0 0 266.893 266.895"
            >
                <path
                    id="Blue_1_"
                    fill="#3C5A99"
                    d="M248.082,262.307c7.854,0,14.223-6.369,14.223-14.225V18.812 c0-7.857-6.368-14.224-14.223-14.224H18.812c-7.857,0-14.224,6.367-14.224,14.224v229.27c0,7.855,6.366,14.225,14.224,14.225 H248.082z"
                />
                <path
                    id="f"
                    fill="#FFFFFF"
                    d="M182.409,262.307v-99.803h33.499l5.016-38.895h-38.515V98.777c0-11.261,3.127-18.935,19.275-18.935 l20.596-0.009V45.045c-3.562-0.474-15.788-1.533-30.012-1.533c-29.695,0-50.025,18.126-50.025,51.413v28.684h-33.585v38.895h33.585 v99.803H182.409z"
                />
            </svg>
        </React.Fragment>
    );
};

const Twitter = ({ sizeMultiplier }: { sizeMultiplier: number }) => {
    const base = 20;
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            x="0px"
            y="0px"
            width={`${base * sizeMultiplier}px`}
            height={`${base * sizeMultiplier}px`}
            viewBox="0 0 612 612"
            // space="preserve" // todo: typescript dont like this.
        >
            <path
                fill="#00AAEC"
                d="M612,116.258c-22.525,9.981-46.694,16.75-72.088,19.772c25.929-15.527,45.777-40.155,55.184-69.411 c-24.322,14.379-51.169,24.82-79.775,30.48c-22.907-24.437-55.49-39.658-91.63-39.658c-69.334,0-125.551,56.217-125.551,125.513 c0,9.828,1.109,19.427,3.251,28.606C197.065,206.32,104.556,156.337,42.641,80.386c-10.823,18.51-16.98,40.078-16.98,63.101    c0,43.559,22.181,81.993,55.835,104.479c-20.575-0.688-39.926-6.348-56.867-15.756v1.568c0,60.806,43.291,111.554,100.693,123.104    c-10.517,2.83-21.607,4.398-33.08,4.398c-8.107,0-15.947-0.803-23.634-2.333c15.985,49.907,62.336,86.199,117.253,87.194    c-42.947,33.654-97.099,53.655-155.916,53.655c-10.134,0-20.116-0.612-29.944-1.721c55.567,35.681,121.536,56.485,192.438,56.485 c230.948,0,357.188-191.291,357.188-357.188l-0.421-16.253C573.872,163.526,595.211,141.422,612,116.258z"
            />
        </svg>
    );
};

const Medium = ({ sizeMultiplier }: { sizeMultiplier: number }) => (
    <svg
        viewBox="0 0 160 126.66667"
        height={`${15.8 * sizeMultiplier}px`}
        width={`${20 * sizeMultiplier}px`}
        xmlSpace="preserve"
        version="1.1"
    >
        <g transform="matrix(1.3333333,0,0,-1.3333333,0,126.66667)">
            <g transform="scale(0.1)">
                <path
                    style={{
                        fill: '#231f20',
                        fillOpacity: 1,
                        fillRule: 'nonzero',
                        stroke: 'none',
                    }}
                    d="m 1200,810 -47.46,0 C 1134.92,810 1110,784.582 1110,768.309 l 0,-589.809 c 0,-16.293 24.92,-38.5 42.54,-38.5 l 47.46,0 0,-140 -430,0 0,140 90,0 0,620 -4.41,0 L 645.422,0 482.707,0 275.25,760 270,760 270,140 360,140 360,0 0,0 0,140 46.0977,140 C 65.082,140 90,162.207 90,178.5 l 0,589.809 C 90,784.582 65.082,810 46.0977,810 L 0,810 l 0,140 450.164,0 147.797,-550 4.066,0 149.164,550 448.809,0 0,-140"
                />
            </g>
        </g>
    </svg>
);

const SocialLogo = ({
    name,
    sizeMultiplier = 1,
}: {
    sizeMultiplier: number;
    name: 'facebook' | 'twitter' | 'medium';
}) => {
    switch (name) {
        case 'facebook':
            return <Facebook sizeMultiplier={sizeMultiplier} />;
        case 'twitter':
            return <Twitter sizeMultiplier={sizeMultiplier} />;
        case 'medium':
            return <Medium sizeMultiplier={sizeMultiplier} />;
        default:
            throw new Error('social not specified');
    }
};

export default SocialLogo;
