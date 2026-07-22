import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AppShell from '../components/AppShell';
import { Card, colors, FormField, PageHeading, PrimaryButton, SecondaryButton } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function EscanearScreen({ navigation, route }) {
  const auditId = route.params?.auditoriaId;
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [asset, setAsset] = useState(null);

  const findAsset = async (code) => {
    if (!code?.trim() || locked) return;
    try { setLocked(true); const value = code.trim(); const folio = value.match(/^ACT-(\d+)$/i);
      setAsset(folio ? await endpoints.asset(Number(folio[1])) : await endpoints.assetByQr(value)); }
    catch (error) { Alert.alert('Activo no encontrado', apiErrorMessage(error)); setLocked(false); }
  };

  const reset = () => { setAsset(null); setManualCode(''); setLocked(false); };
  const review = () => {
    navigation.navigate('ConsultarActivo', { activo: asset });
  };

  return <AppShell navigation={navigation} title="Escanear activo" activeRoute="Escanear">
    <ScrollView contentContainerStyle={styles.content}>
      <PageHeading eyebrow="// VERIFICACION QR" title="Escanear activo" subtitle="Escanea el codigo QR o captura su identificador manualmente." />
      <Card>
        {!permission?.granted ? <View style={styles.permission}>
          <Text style={styles.help}>La camara requiere autorizacion para leer codigos QR.</Text>
          <PrimaryButton title="Permitir camara" icon="camera-outline" onPress={requestPermission} />
        </View> : !asset ? <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={locked ? undefined : ({ data }) => findAsset(data)} /> : null}

        {!asset && <>
          <FormField label="FOLIO MANUAL" value={manualCode} onChangeText={setManualCode}
            placeholder="Ej. ACT-000001" icon="search-outline" />
          <PrimaryButton title="Buscar activo" icon="search-outline" onPress={() => findAsset(manualCode)} />
        </>}

        {asset && <View style={styles.result}>
          <Text style={styles.eyebrow}>ACTIVO ENCONTRADO</Text><Text style={styles.title}>{asset.nombre}</Text>
          <Text style={styles.help}>{asset.folio} · {asset.ubicacion || 'Sin ubicacion'}</Text>
          <PrimaryButton title="Consultar activo" icon="document-text-outline" onPress={review} />
          <SecondaryButton title="Escanear otro codigo" icon="refresh-outline" onPress={reset} />
        </View>}
      </Card>
    </ScrollView>
  </AppShell>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 42 }, camera: { height: 320, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  permission: { gap: 14, marginBottom: 16 }, result: { gap: 10 }, eyebrow: { color: colors.accentDark, fontSize: 10, fontWeight: '800' },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' }, help: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
