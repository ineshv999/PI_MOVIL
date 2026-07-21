import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  Text,
} from 'react-native';
import AppShell from '../components/AppShell';
import {
  colors,
  PageHeading,
  Card,
  FormField,
  PrimaryButton,
} from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function RegistrarActivoScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [folio, setFolio] = useState('');
  const [edificio, setEdificio] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [garantia, setGarantia] = useState('');
  const [qr, setQr] = useState('');

  const save = async () => {
    if (!nombre.trim() || !folio.trim() || !edificio.trim() || !ubicacion.trim()) {
      Alert.alert('Campos incompletos', 'Completa nombre, folio, edificio y ubicación.');
      return;
    }

    try {
      let buildings = await endpoints.buildings();
      let building = buildings.find((item) => item.nombre.toLowerCase() === edificio.trim().toLowerCase());
      if (!building) building = await endpoints.createBuilding({ nombre: edificio.trim(), ubicacion: ubicacion.trim() });
      const statuses = await endpoints.statuses();
      const status = statuses.find((item) => item.nombre === 'Bueno') || statuses[0];
      await endpoints.createAsset({ codigo_qr: (qr || folio).trim(), nombre: nombre.trim(), descripcion: null,
        numero_serie: folio.trim(), edificio_id: building.id, estatus_id: status?.id,
        ubicacion: ubicacion.trim(), garantia: garantia.trim() || null, foto_url: null });
    } catch (error) { Alert.alert('No fue posible registrar', apiErrorMessage(error)); return; }
    Alert.alert('Activo registrado', `${nombre} se agregó al inventario.`);
    setNombre('');
    setFolio('');
    setEdificio('');
    setUbicacion('');
    setGarantia('');
    setQr('');
  };

  return (
    <AppShell
      navigation={navigation}
      title="Registrar activo"
      activeRoute="RegistrarActivo"
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeading
          eyebrow="// ALTA DE INVENTARIO"
          title="Registrar activo"
          subtitle="Captura la información base que será utilizada durante las auditorías."
        />

        <Card>
          <FormField
            label="NOMBRE DEL ACTIVO *"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Laptop Dell Latitude"
            icon="cube-outline"
          />
          <FormField
            label="FOLIO *"
            value={folio}
            onChangeText={setFolio}
            placeholder="ACT-0001"
            icon="pricetag-outline"
          />
          <FormField
            label="EDIFICIO *"
            value={edificio}
            onChangeText={setEdificio}
            placeholder="Ej. Edificio A"
            icon="business-outline"
          />
          <FormField
            label="UBICACIÓN ACTUAL *"
            value={ubicacion}
            onChangeText={setUbicacion}
            placeholder="Ej. Laboratorio 3"
            icon="location-outline"
          />
          <FormField
            label="GARANTÍA"
            value={garantia}
            onChangeText={setGarantia}
            placeholder="AAAA-MM-DD"
            icon="calendar-outline"
          />
          <FormField
            label="CÓDIGO QR"
            value={qr}
            onChangeText={setQr}
            placeholder="Contenido o identificador QR"
            icon="qr-code-outline"
          />

          <Text style={styles.note}>
            La fotografía y el código QR podrán conectarse posteriormente con
            cámara y almacenamiento.
          </Text>

          <PrimaryButton
            title="Registrar activo"
            icon="add-circle-outline"
            onPress={save}
          />
        </Card>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 42,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 16,
  },
});
