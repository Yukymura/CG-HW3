#version 300 es

in vec4 vPosition;
out vec3 TexCoords;

uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

// 添加世界位置输出（如果需要）
out vec3 WorldPos;

void main()
{
    TexCoords = vPosition.xyz;
    WorldPos = vPosition.xyz; // 传递世界位置
    
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * vPosition;
    gl_Position = gl_Position.xyww;
}