import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import dlt from 'dltjs';

export default function RoomCanvas({ bgImageSrc, materialImageSrc, maskData }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!bgImageSrc ||!materialImageSrc ||!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    
    // Limpiar renderizados previos
    mountRef.current.innerHTML = ''; 
    mountRef.current.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    const tBackground = loader.load(bgImageSrc);
    const tMaterial = loader.load(materialImageSrc);
    tMaterial.wrapS = THREE.RepeatWrapping;
    tMaterial.wrapT = THREE.RepeatWrapping;

    // Cálculo de la Matriz de Homografía para la perspectiva 
    // p0: Cuadrado perfecto de la textura
    const p0 = [, , , [1, 1]]; 
    // p1: Fuga de perspectiva del suelo en la habitación
    const p1 = [[0.2, 0.2], [0.05, 0.9], [0.8, 0.2], [0.95, 0.9]]; 
    const M = dlt.dlt2d(p0, p1);

    // Shader programable en WebGL
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tMaterial: { value: tMaterial },
        tBackground: { value: tBackground },
        transformMat: { 
          value: new THREE.Matrix3(
            M, M[1], M[2], 
            M[1], M[1][1], M[1][2], 
            M[2], M[2][1], M[2][2]
          ) 
        }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tMaterial;
        uniform sampler2D tBackground;
        uniform mat3 transformMat;
        varying vec2 vUv;

        vec2 warpPoint(mat3 transformMat, vec2 p) {
          vec3 result = transformMat * vec3(p, 1.0);
          return vec2(result.x / result.z, result.y / result.z);
        }

        void main() {
          vec2 warpedUV = warpPoint(transformMat, vUv);
          vec4 matColor = texture2D(tMaterial, fract(warpedUV * 4.0)); // 4.0 es la escala de repetición
          
          vec4 bgColor = texture2D(tBackground, vUv);
          float shadowMap = (bgColor.r + bgColor.g + bgColor.b) / 3.0;

          // Modo Multiply para mezclar las sombras reales con la textura nueva
          vec3 finalBlend = matColor.rgb * (shadowMap * 1.5);
          
          gl_FragColor = vec4(finalBlend, 1.0);
        }
      `
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
    scene.add(plane);
    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
    };
  },);

  return <div ref={mountRef} style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden' }} />;
}