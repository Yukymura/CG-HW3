#version 300 es

precision mediump float;

out vec4 FragColor;

in vec3 TexCoords;

uniform samplerCube cubeSampler;//采样器

// 雾化效果参数
uniform bool fogEnabled;
uniform float fogDensity;
uniform vec3 fogColor;
uniform vec3 viewPos;

// 计算雾化因子 - 天空盒使用不同的计算方式
float computeSkyboxFogFactor()
{
    if (!fogEnabled) {
        return 0.0;
    }
    
    // 对于天空盒，我们使用固定的距离或者基于视线方向计算
    // 这里我们使用一个较大的固定距离来模拟远处雾化
    float distance = 50.0; // 天空盒在远处，使用固定距离
    
    // 使用指数雾化公式
    float fogFactor = exp(-fogDensity * fogDensity * distance * distance * 0.1);
    
    // 限制在0-1之间
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    
    return 1.0 - fogFactor;
}

void main()
{    
    vec4 skyboxColor = texture(cubeSampler, TexCoords);
    
    // 应用雾化效果到天空盒
    float fogFactor = computeSkyboxFogFactor();
    vec3 finalColor = mix(skyboxColor.rgb, fogColor, fogFactor);
    
    FragColor = vec4(finalColor, skyboxColor.a);
}