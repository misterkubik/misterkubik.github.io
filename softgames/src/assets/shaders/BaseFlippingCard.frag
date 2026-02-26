precision highp float;
varying vec2 vTextureCoordBack;
varying vec2 vTextureCoordFront;
varying float vTextureProgress;

uniform vec4 uColor;
uniform sampler2D uSamplerFront;
uniform sampler2D uSamplerBack;
uniform float uDim;

void main(void)
{
    vec4 backSide = texture2D(uSamplerBack, vTextureCoordBack);
    vec4 frontSide = texture2D(uSamplerFront, vTextureCoordFront);

    vec4 tex = mix(backSide, frontSide, smoothstep(0.4, 0.6, vTextureProgress));

    float st = smoothstep(0.4, 0.05, vTextureProgress) - 0.5;
    float lt = smoothstep(0.3, 0.5, vTextureProgress) - 0.5;

    float shade = smoothstep(0.0, 0.5, abs(st));
    float light = smoothstep(0.0, 0.5, abs(lt) - sin(lt / 20.0) * 0.1 );

    tex *= uColor;
    float a = tex.a;

    vec4 shadeColor = mix(vec4(0.0, 0.05, 0.1, a) * a, tex, 0.7);

    tex = mix(shadeColor, tex, shade); //add shades
    tex = mix(vec4(vec3(1.0, 0.98, 0.94) * 0.8, a) * a, tex, light); //add lights

    float dim = max(1.0 - uDim, 0.0);
    vec3 dimmedColor = mix(tex.rgb, tex.ggg, uDim) * dim;
    gl_FragColor = vec4(dimmedColor * a, a);
}
