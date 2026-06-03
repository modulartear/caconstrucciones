import * as ort from 'onnxruntime-web';

ort.env.wasm.numThreads = 4;
ort.env.wasm.simd = true;

class AiEngine {
  constructor() {
    this.encoderSession = null;
    this.decoderSession = null;
    this.imageEmbeddings = null; // Guardará el análisis de la imagen
  }

  async loadModels() {
    if (!this.encoderSession) {
      // Cargar ambos modelos
      this.encoderSession = await ort.InferenceSession.create('/models/encoder.onnx', { executionProviders: ['webgpu', 'wasm'] });
      this.decoderSession = await ort.InferenceSession.create('/models/decoder.onnx', { executionProviders: ['webgpu', 'wasm'] });
    }
  }

  // Paso 1: Se ejecuta UNA VEZ cuando el usuario sube la foto
  async encodeImage(imageTensor) {
    // Ejecuta el encoder y guarda las características en memoria
    const results = await this.encoderSession.run({ image: imageTensor });
    this.imageEmbeddings = results; 
  }

  // Paso 2: Se ejecuta en milisegundos cada vez que el usuario hace CLIC
  async decodeClick(x, y) {
    if (!this.imageEmbeddings) throw new Error("La imagen aún no ha sido codificada");

    // Se construyen los tensores con las coordenadas X, Y del clic
    const pointCoords = new ort.Tensor('float32', new Float32Array([x, y]), [1, 1, 2]);
    const pointLabels = new ort.Tensor('float32', new Float32Array([1]), [1, 1]); // '1' indica a la IA que seleccione ese objeto

    // Se inyectan las características de la imagen procesada previamente y las coordenadas
    const inputs = {
     ...this.imageEmbeddings, 
      point_coords: pointCoords,
      point_labels: pointLabels
    };

    const results = await this.decoderSession.run(inputs);
    return results.masks.data; // Retorna la máscara exacta de la pared o piso
  }
}

export const aiEngine = new AiEngine();