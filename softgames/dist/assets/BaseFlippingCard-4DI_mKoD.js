const e=`precision highp float;
#define PI 3.14159265358979323846  /* pi */
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrixBack;
uniform mat3 uTextureMatrixFront;
uniform vec2 uRes;
uniform float uFoldProgress;
uniform float uFoldAngle;
uniform float uFoldForce;
uniform float uFoldSymmetry;

varying vec2 vTextureCoordBack;
varying vec2 vTextureCoordFront;
varying float vTextureProgress;

mat2 rotate2d(float ang){
    return mat2(cos(ang),-sin(ang),
                sin(ang),cos(ang));
}

void main(void)
{

	float minRes = min(uRes.x, uRes.y);
	float maxRes = max(uRes.x, uRes.y);
	vec2 uvRes = vec2(uRes.x / maxRes, uRes.y / maxRes);
    vec2 uv = aVertexPosition / uRes;
    vec2 uvc = uv * 2.0 - 1.0;
    vec2 uvR = uv * uvRes;
    vec2 uvRC = uvc * uvRes;
    vec2 vAng = vec2(cos(uFoldAngle), sin(uFoldAngle));
    vec2 centerVertexPosition = aVertexPosition - uRes * 0.5;
    float globalAngle = mod(PI * 4.0 - uFoldAngle * 2.0, PI);

    if (abs(globalAngle) >= abs(PI * 2.0 - globalAngle)) {
    	globalAngle = PI * 2.0 - globalAngle;
    }

    // if (globalAngle < PI * 0.5 && globalAngle >= PI * 1.5) {
    // 	globalAngle = PI * 2.0 - globalAngle;
    // }

    mat2 globalMatrix = rotate2d(globalAngle * smoothstep(0.2, 0.7, uFoldProgress) * uFoldSymmetry);

    vec2 normal = normalize(uv * 2.0 - 1.0);
    float dotP = dot(normal, vAng);

    mat2 matrix = rotate2d(uFoldAngle);
    mat2 revMatrix = rotate2d(-uFoldAngle);
    mat2 subMatrix = rotate2d(-uFoldAngle + PI);

    vec2 r = smoothstep(-0.5, 1.5, uv * matrix);

    float progressMat = 1.0 - smoothstep(-1.0, 1.0, dot(uvc, vAng));
    float centerDist = smoothstep(min(uRes.x, uRes.y) / 2.0, max(uRes.x, uRes.y) / 2.0, length(centerVertexPosition));

    float force = uFoldForce * 0.5 + 0.5;
    float p1 = smoothstep(0.0, force, uFoldProgress);
    float p2 = smoothstep(1.0 - force, 1.0, uFoldProgress);
    float t = min(progressMat, length(uvRC) * 0.5 + 0.5);
    // float t = progressMat;
    float p = mix(p1, p2, t);

    vTextureProgress = p;

    float fx = p * -2.0 + 1.0;

    float np = mix(0.0, p, 1.0 - abs(dotP));
    float side = step(dotP * 0.5 + 0.5, 0.5);
    vec2 rev = (aVertexPosition - uRes * 0.5) * revMatrix;
    vec2 reversedPosition = vec2(-rev.x, rev.y) * matrix + uRes * 0.5;

    vec2 nVertexPosition = mix(aVertexPosition, reversedPosition, p);

    nVertexPosition = (nVertexPosition - uRes * 0.5) * globalMatrix + uRes * 0.5;

    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(nVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoordBack = (uTextureMatrixBack * vec3(aTextureCoord, 1.0)).xy;


    // vTextureCoordBack = aTextureCoord;

    float ori = step(cos(-uFoldAngle), sin(-uFoldAngle));
    vec2 vMirror = mix(vec2(-1.0, 1.0), vec2(1.0, -1.0), ori);
    vec2 vOffset = mix(vec2(1.0, 0.0), vec2(0.0, 1.0), ori);

    vec2 texCoord = aTextureCoord;

    float aa = mod(PI * 2.0 + uFoldAngle, PI);
   if (aa < PI * 0.5 && aa >= PI * 1.5) {
      texCoord = vec2(1.0) - texCoord;
    }

    vTextureCoordFront = (uTextureMatrixFront * vec3(texCoord * vMirror + vOffset, 1.0)).xy;

}
`;export{e as default};
