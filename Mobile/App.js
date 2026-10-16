import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, 
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';

// Módulo de Autenticação Biométrica do Expo
import * as LocalAuthentication from 'expo-local-authentication';

// Endpoint da API. Aponta automaticamente para o IP da sua máquina na rede Wi-Fi.
const API_URL = 'http://192.168.18.15:3000/api/v1/ocorrencias'; 

export default function App() {
  const [localizacaoUser, setLocalizacaoUser] = useState(null);
  const [ocorrenciasNoMapa, setOcorrenciasNoMapa] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  
  const [tipoOcorrencia, setTipoOcorrencia] = useState('Alagamento');
  const [descricaoOcorrencia, setDescricaoOcorrencia] = useState('');
  
  const [isLoadingRede, setIsLoadingRede] = useState(true);
  const [isEnviando, setIsEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de GPS negada.');
        setIsLoadingRede(false);
        return;
      }

      let gps = await Location.getCurrentPositionAsync({});
      setLocalizacaoUser({
        latitude: gps.coords.latitude,
        longitude: gps.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      await carregarOcorrencias();
    })();
  }, []);

  const carregarOcorrencias = async () => {
    try {
      setIsLoadingRede(true);
      const res = await fetch(API_URL);
      const dataJson = await res.json();
      
      if(dataJson.sucesso) {
        setOcorrenciasNoMapa(dataJson.dados);
      }
    } catch (e) {
      console.warn("Erro ao buscar dados do servidor", e);
    } finally {
      setIsLoadingRede(false);
    }
  };

  const autenticarBiometria = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Erro de Segurança', 'Dispositivo não possui biometria configurada.');
        return false;
      }

      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Valide sua identidade para enviar denúncia',
        fallbackLabel: 'Usar Senha',
      });

      return auth.success;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const enviarDenuncia = async () => {
    if (!localizacaoUser) return;

    const authSucesso = await autenticarBiometria();

    if (!authSucesso) {
      Alert.alert('Falha', 'Autenticação Biométrica falhou.');
      return;
    }

    setIsEnviando(true);
    const payload = {
      tipo: tipoOcorrencia,
      descricao: descricaoOcorrencia,
      latitude: localizacaoUser.latitude,
      longitude: localizacaoUser.longitude,
      assinatura_biometrica_aparelho: true
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const body = await res.json();

      if (res.status === 201) {
        Alert.alert('Sucesso', 'Denúncia enviada ao servidor!');
        setModalAberto(false);
        setDescricaoOcorrencia('');
        await carregarOcorrencias();
      } else {
        Alert.alert('Erro', body.erro || 'Erro desconhecido');
      }
    } catch (error) {
      Alert.alert('Erro de Rede', 'Não foi possível conectar ao servidor. O pacote foi salvo localmente.');
    } finally {
      setIsEnviando(false);
    }
  };

  const getCorPin = (tipo) => {
    switch(tipo) {
      case 'Alagamento': return 'blue';
      case 'Desmatamento': return 'green';
      case 'Poluicao_Ar': return 'gray';
      case 'Transito': return 'red';
      default: return 'orange';
    }
  };

  if (isLoadingRede && !localizacaoUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={styles.txtLoading}>Aguardando GPS e Servidor...</Text>
      </View>
    );
  }

  const gerarMapaHtml = () => {
    if (!localizacaoUser) return '';
    
    // Gerando pinos para as ocorrências
    const marcadores = ocorrenciasNoMapa.map(o => {
      let color = 'blue';
      if (o.tipo === 'Desmatamento') color = 'green';
      if (o.tipo === 'Poluicao_Ar') color = 'gray';
      if (o.tipo === 'Transito') color = 'red';

      return `
        L.circleMarker([${o.latitude}, ${o.longitude}], {
          color: '${color}',
          fillColor: '${color}',
          fillOpacity: 0.8,
          radius: 8
        }).addTo(map).bindPopup('<b>${o.tipo}</b><br>${o.descricao}');
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          #map { height: 100vh; width: 100vw; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${localizacaoUser.latitude}, ${localizacaoUser.longitude}], 15);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          L.marker([${localizacaoUser.latitude}, ${localizacaoUser.longitude}]).addTo(map)
            .bindPopup('Sua Localização').openPopup();

          ${marcadores}
        </script>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <WebView 
          source={{ html: gerarMapaHtml() }}
          style={{ flex: 1, width: '100%' }}
        />

      <TouchableOpacity style={styles.fabBtn} onPress={() => setModalAberto(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalAberto} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBg}>
          <View style={styles.modalPainel}>
            <Text style={styles.modalTitulo}>Nova Denúncia</Text>
            
            <Text style={styles.label}>Tipo de Ocorrência:</Text>
            <View style={styles.pickerBorda}>
              <Picker selectedValue={tipoOcorrencia} onValueChange={setTipoOcorrencia}>
                <Picker.Item label="Alagamento" value="Alagamento" />
                <Picker.Item label="Desmatamento" value="Desmatamento" />
                <Picker.Item label="Poluição" value="Poluicao_Ar" />
                <Picker.Item label="Trânsito Intenso" value="Transito" />
                <Picker.Item label="Outro" value="Outro" />
              </Picker>
            </View>

            <Text style={styles.label}>Descrição:</Text>
            <TextInput
              style={styles.inputArea}
              multiline
              numberOfLines={4}
              placeholder="Descreva a ocorrência..."
              value={descricaoOcorrencia}
              onChangeText={setDescricaoOcorrencia}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalAberto(false)}>
                <Text style={styles.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnConfirmar} onPress={enviarDenuncia} disabled={isEnviando}>
                {isEnviando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.txtConfirmar}>Validar e Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
  txtLoading: { color: '#00C853', marginTop: 15, fontSize: 16 },
  fabBtn: {
    position: 'absolute', bottom: 40, right: 30, width: 70, height: 70,
    borderRadius: 35, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', elevation: 8
  },
  fabIcon: { fontSize: 38, color: '#FFF' },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalPainel: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 10 },
  pickerBorda: { borderWidth: 1, borderColor: '#CCC', borderRadius: 10, marginBottom: 10 },
  inputArea: { borderWidth: 1, borderColor: '#CCC', borderRadius: 10, padding: 15, height: 100, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnCancelar: { flex: 1, backgroundColor: '#EEE', padding: 15, borderRadius: 10, marginRight: 10, alignItems: 'center' },
  btnConfirmar: { flex: 2, backgroundColor: '#00C853', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txtCancelar: { color: '#666', fontWeight: 'bold' },
  txtConfirmar: { color: '#FFF', fontWeight: 'bold' }
});
