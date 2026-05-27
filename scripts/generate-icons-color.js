import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SOURCE_ICON = path.join(PUBLIC_DIR, 'logo-splash.svg');

// Color de fondo exacto para los iconos maskables (Android Splash)
const APP_BACKGROUND_COLOR = '#003874'; 

const ICONS = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-192-maskable.png', size: 192, maskable: true },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false, background: APP_BACKGROUND_COLOR } // 👈 Con la llave corregida
];

async function generateIcons() {
  try {
    // Comprobar si existe el SVG fuente
    await fs.access(SOURCE_ICON);
    
    console.log('Generando iconos PWA optimizados desde logo-splash.svg...\n');

    for (const icon of ICONS) {
      const outputPath = path.join(PUBLIC_DIR, icon.name);
      
      let pipeline;

      // Determinamos el color de fondo para este icono específico
      const targetBackground = icon.background || (icon.maskable ? APP_BACKGROUND_COLOR : null);

      if (targetBackground) {
        // CONFIGURACIÓN PARA FONDOS SÓLIDOS (Maskables y Apple)
        pipeline = sharp(SOURCE_ICON)
          .resize(icon.size, icon.size, {
            fit: 'contain',
            kernel: sharp.kernel.lanczos3,
            background: targetBackground // Aplica el color correcto al redimensionar (evita el fondo negro por defecto)
          })
          .flatten({ background: targetBackground }) // Asegura el acoplado plano final sin alphas
          .png({ 
            quality: 100, 
            compressionLevel: 9, 
            palette: true // Elimina perfiles de color extraños para evitar variaciones cromáticas en Android
          });
      } else {
        // CONFIGURACIÓN PARA ICONOS TRANSPARENTES (Any)
        pipeline = sharp(SOURCE_ICON)
          .resize(icon.size, icon.size, {
            fit: 'cover',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({ quality: 100 });
      }

      await pipeline.toFile(outputPath);
      console.log(`✅ Creado: ${icon.name} (${icon.size}x${icon.size})${targetBackground ? ` [Fondo: ${targetBackground}]` : ' [Transparente]'}`);
    }

    console.log('\n¡Todos los iconos generados correctamente!');
    console.log('Recuerda asegurarte de que astro.config.mjs hace referencia a estos archivos.');
  } catch (error) {
    console.error('Error generando los iconos:', error);
    if (error.code === 'ENOENT') {
      console.error(`Asegúrate de que existe el archivo base en: ${SOURCE_ICON}`);
    }
  }
}

generateIcons();