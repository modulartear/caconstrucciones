import React, { useState, useEffect } from 'react';
import { aiEngine } from '../lib/ai-engine';
import RoomCanvas from './RoomCanvas';

export default function VisualizerApp() {
  const [materials, setMaterials] = useState([]);
  const [activeMaterial, setActiveMaterial] = useState(null);
  
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maskData, setMaskData] = useState(null);

  useEffect(() => {
    // Carga de Firebase local
    if (window.CAStore) {
      const loadedMaterials = window.CAStore.get('materials') || [];
      setMaterials(loadedMaterials);
      if (loadedMaterials.length > 0) {
        setActiveMaterial(loadedMaterials[0]);
      }
    }
    
    // Inicia la IA en segundo plano
    aiEngine.loadModel().catch(console.error);
  }, []);

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setIsProcessing(true);
    setMaskData(null);

    const img = new Image();
    img.src = url;
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        
        const generatedMask = await aiEngine.segmentImage(imgData.data, img.width, img.height);
        setMaskData(generatedMask);

      } catch (error) {
        console.error("Error al segmentar:", error);
      } finally {
        setIsProcessing(false);
      }
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '20px', background: '#0a0a0c', color: '#fff', textAlign: 'center' }}>
        <h2>Visualizador Espacial 3D</h2>
        <p style={{ color: '#aaa', fontSize: '14px' }}>IA y Renderizado Local en Tiempo Real</p>
      </header>

      <main style={{ display: 'flex', flex: 1, backgroundColor: '#1e1e24' }}>
        
        {/* Panel Central: El Renderizador */}
        <section style={{ flex: 3, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!photoUrl? (
            <div style={{ textAlign: 'center', background: '#2a2a35', padding: '50px', borderRadius: '12px', color: '#fff' }}>
              <h3>Sube una foto de tu espacio</h3>
              <p style={{ color: '#888', marginBottom: '20px' }}>Soporta JPG y PNG</p>
              <label style={{ background: '#007bff', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
                Elegir Archivo
                <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
              </label>
            </div>
          ) : isProcessing? (
            <div style={{ color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚙️</div>
              <h3>Analizando geometría con IA...</h3>
            </div>
          ) : (
            <RoomCanvas 
              bgImageSrc={photoUrl} 
              materialImageSrc={activeMaterial?.photo} 
              maskData={maskData} 
            />
          )}
        </section>

        {/* Panel Lateral: Tu Catálogo de Firebase */}
        <aside style={{ flex: 1, background: '#fff', padding: '20px', overflowY: 'auto' }}>
          <h3>Catálogo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
            {materials.map(mat => (
              <div 
                key={mat.id} 
                onClick={() => setActiveMaterial(mat)}
                style={{ 
                  border: activeMaterial?.id === mat.id? '3px solid #007bff' : '1px solid #eee', 
                  borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' 
                }}
              >
                {mat.photo? (
                  <img src={mat.photo} alt={mat.name} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '80px', backgroundColor: mat.color || '#ccc' }} />
                )}
                <p style={{ fontSize: '12px', textAlign: 'center', padding: '8px', margin: 0, fontWeight: 'bold' }}>
                  {mat.name}
                </p>
              </div>
            ))}
          </div>

          {photoUrl && (
            <button 
              style={{ width: '100%', padding: '15px', marginTop: '30px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => setPhotoUrl(null)}
            >
              🔄 Subir otra foto
            </button>
          )}
        </aside>
      </main>
    </div>
  );
}