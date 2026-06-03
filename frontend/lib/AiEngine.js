import * as ort from 'onnxruntime-web';

// Optimizaciones para máxima velocidad en el navegador
ort.env.wasm.numThreads = 4;
ort.env.wasm.simd = true;

class AiEngine {
  constructor() {
    this.session = null;
    this.isReady = false;
  }

  // Carga un modelo ONNX ligero (Debes colocar un archivo.onnx en tu carpeta public/models/)
  async loadModel(modelUrl = '/models/segmentation.onnx') {
    if (!this.session) {
      try {
        this.session = await ort.InferenceSession.create(modelUrl, {
          executionProviders: ['webgpu', 'wasm']
        });
        this.isReady = true;
        console.log("Motor de IA cargado exitosamente.");
      } catch (err) {
        console.error("Error cargando el modelo de IA:", err);
      }
    }
  }

  // Extrae la máscara binaria (blanco y negro) de la imagen
  async segmentImage(imageData, width, height) {
    if (!this.isReady) throw new Error("La IA aún no está inicializada.");
    const tensor = new ort.Tensor('float32', imageData, [1, 3, height, width]);
    const results = await this.session.run({ input: tensor });
    return results.output.data; 
  }
}

export const aiEngine = new AiEngine();