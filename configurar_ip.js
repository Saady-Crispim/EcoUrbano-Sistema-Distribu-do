const fs = require('fs');
const os = require('os');
const path = require('path');

try {
  const nets = os.networkInterfaces();
  let localIp = '127.0.0.1';

  // Procura por adaptador de rede IPv4 externo (Wi-Fi ou Ethernet)
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp !== '127.0.0.1') break;
  }

  console.log(`[INFO] IP local detectado na rede: ${localIp}`);

  const appJsPath = path.join(__dirname, 'Mobile', 'App.js');
  if (fs.existsSync(appJsPath)) {
    let content = fs.readFileSync(appJsPath, 'utf8');
    const novoEndpoint = `const API_URL = 'http://${localIp}:3000/api/v1/ocorrencias';`;
    content = content.replace(/const API_URL = [^;]+;/, novoEndpoint);
    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log(`[OK] Mobile configurado com sucesso para: http://${localIp}:3000/api/v1/ocorrencias`);
  } else {
    console.warn(`[AVISO] Arquivo Mobile/App.js nao encontrado.`);
  }
} catch (err) {
  console.error(`[ERRO ao configurar IP]:`, err.message);
}
