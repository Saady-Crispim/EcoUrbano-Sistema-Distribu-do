# EcoUrbano - Sistema Distribuído

Sistema de monitoramento e registro colaborativo de ocorrências ambientais urbanas, composto por uma API Backend distribuída e um aplicativo móvel em React Native com validação biométrica e geolocalização.

---

## Arquitetura do Projeto

O projeto é dividido em dois módulos principais:

- **`Backend/`**: Servidor Node.js (Express, MongoDB com fallback resiliente em memória RAM) para gerenciamento de ocorrências e distribuição de dados.
- **`Mobile/`**: Aplicativo móvel construído em React Native com Expo, mapas interativos, captura de GPS e autenticação biométrica (FaceID / Digital).

---

## Como Executar

### Método Rápido (Windows)
Basta dar um duplo clique no arquivo:
```
INICIAR_ECOURBANO.bat
```
O script cuidará da validação de dependências, detecção automática de IP da máquina na rede local e inicialização simultânea dos serviços.

---

### Execução Manual

#### 1. Iniciar o Backend
```bash
cd Backend
npm install
npm start
```
*O servidor iniciará em `http://0.0.0.0:3000`.*  
*Diagnóstico da API: `http://localhost:3000/health`*

#### 2. Configurar o IP Local
Descubra seu endereço IP local executando `ipconfig` no terminal e atualize a URL em `Mobile/App.js` ou execute:
```bash
node configurar_ip.js
```

#### 3. Iniciar o Aplicativo Mobile
```bash
cd Mobile
npm install
npm start
```
Abra o aplicativo **Expo Go** em seu smartphone (conectado à mesma rede Wi-Fi) e escaneie o QR Code exibido no terminal.
