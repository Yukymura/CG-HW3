#version 300 es
precision mediump float;

out vec4 FragColor;

uniform float ambientStrength, specularStrength, diffuseStrength,shininess;

in vec3 Normal;//法向量
in vec3 FragPos;//相机观察的片元位置
in vec2 TexCoord;//纹理坐标
in vec4 FragPosLightSpace;//光源观察的片元位置

uniform vec3 viewPos;//相机位置
uniform vec4 u_lightPosition; //光源位置	
uniform vec3 lightColor;//入射光颜色

uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform samplerCube cubeSampler;//盒子纹理采样器

// 雾化效果参数
uniform bool fogEnabled;
uniform float fogDensity;
uniform vec3 fogColor;

float shadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir)
{
    // 执行透视除法
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    
    // 变换到[0,1]范围
    projCoords = projCoords * 0.5 + 0.5;
    
    // 检查是否在视锥体外
    if(projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || 
       projCoords.y < 0.0 || projCoords.y > 1.0)
        return 0.0;
    
    // 获取当前片段在光源视角下的深度
    float currentDepth = projCoords.z;
    
    // 从深度纹理中获取最近的深度
    float closestDepth = texture(depthTexture, projCoords.xy).r;
    
    // 动态偏差计算 - 根据光线角度调整
    float bias;
    if(u_lightPosition.w == 1.0){
    	bias = 0.0008;
    }else{
    	bias = 0.005;
    }
    
    // 使用PCF（百分比渐进过滤）来柔化阴影边缘
    float shadow = 0.0;
    vec2 texelSize = 1.0 / vec2(textureSize(depthTexture, 0));
    for(int x = -2; x <= 2; ++x)
    {
        for(int y = -2; y <= 2; ++y)
        {
            float pcfDepth = texture(depthTexture, projCoords.xy + vec2(x, y) * texelSize).r;
            shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;
        }
    }
    shadow /= 25.0;
    
    return shadow;
} 

// 计算雾化因子
float computeFogFactor()
{
    if (!fogEnabled) {
        return 0.0;
    }
    
    float distance = length(FragPos - viewPos);
    
    // 使用指数雾化公式
    float fogFactor = exp(-fogDensity * fogDensity * distance * distance * 0.1);
    
    // 限制在0-1之间
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    
    return 1.0 - fogFactor;
}

void main()
{
    //采样纹理颜色
    vec3 TextureColor = texture(diffuseTexture, TexCoord).xyz;

    //计算光照颜色
    vec3 norm = normalize(Normal);
    vec3 lightDir;
    if(u_lightPosition.w==1.0) 
        lightDir = normalize(u_lightPosition.xyz - FragPos);
    else lightDir = normalize(u_lightPosition.xyz);
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 halfDir = normalize(viewDir + lightDir);

    // 环境光分量
    vec3 ambient = ambientStrength * lightColor;

    // 漫反射分量
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diffuseStrength * diff * lightColor;

    // 镜面反射分量
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = specularStrength * spec * lightColor;
    
    vec3 lightReflectColor=(ambient +diffuse + specular);

    //判定是否阴影，并对各种颜色进行混合
    float shadow = shadowCalculation(FragPosLightSpace, norm, lightDir);
    
    //vec3 resultColor =(ambient + (1.0-shadow) * (diffuse + specular))* TextureColor;
    vec3 resultColor=(1.0-shadow/2.0)* lightReflectColor * TextureColor;
    
    // 应用雾化效果
    float fogFactor = computeFogFactor();
    vec3 finalColor = mix(resultColor, fogColor, fogFactor);
    
    FragColor = vec4(finalColor, 1.f);
}