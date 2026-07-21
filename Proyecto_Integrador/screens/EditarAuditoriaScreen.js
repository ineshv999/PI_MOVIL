import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import AppShell from '../components/AppShell';
import {
  PageHeading,
  Card,
  FormField,
  PrimaryButton,
  SecondaryButton,
} from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function EditarAuditoriaScreen({ navigation, route }) {
  const auditoria = route.params?.auditoria || {
    id: 7,
    nombre: 'Auditoría de Control #7',
    descripcion: 'Revisión de inventario general de activos fijos.',
    fechaProgramada: '2026-06-18',
    responsable: 'Eduardo',
  };

  const [nombre, setNombre] = useState(auditoria.nombre);
  const [descripcion, setDescripcion] = useState(auditoria.descripcion);
  const [fecha, setFecha] = useState(auditoria.fechaProgramada);
  const [responsable, setResponsable] = useState(auditoria.responsable);

  const save = async () => {
    if (!nombre.trim()) {
      Alert.alert('Nombre obligatorio', 'La auditoría debe tener un nombre.');
      return;
    }

    try {
      const extractedId = Number(String(responsable).match(/\d+/)?.[0] || auditoria.responsable_id);
      await endpoints.updateAudit(auditoria.id, { titulo: nombre.trim(), descripcion: descripcion.trim() || null,
        fecha_programada: fecha ? `${fecha}T09:00:00-06:00` : null, ...(extractedId ? { responsable_id: extractedId } : {}) });
    } catch (error) { Alert.alert('No fue posible actualizar', apiErrorMessage(error)); return; }
    Alert.alert(
      'Cambios guardados',
      'La información de la auditoría fue actualizada.',
      [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <AppShell
      navigation={navigation}
      title="Editar auditoría"
      activeRoute="Auditorias"
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeading
          eyebrow="// EDICIÓN"
          title="Editar auditoría"
          subtitle={`Modifica los datos de la auditoría #${auditoria.id}.`}
        />

        <Card>
          <FormField
            label="NOMBRE DE LA AUDITORÍA *"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre"
            icon="create-outline"
          />
          <FormField
            label="DESCRIPCIÓN"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción"
            icon="document-text-outline"
            multiline
          />
          <FormField
            label="FECHA PROGRAMADA"
            value={fecha}
            onChangeText={setFecha}
            placeholder="AAAA-MM-DD"
            icon="calendar-outline"
          />
          <FormField
            label="RESPONSABLE"
            value={responsable}
            onChangeText={setResponsable}
            placeholder="Responsable"
            icon="person-outline"
          />

          <PrimaryButton
            title="Guardar cambios"
            icon="save-outline"
            onPress={save}
          />
          <SecondaryButton
            title="Cancelar"
            icon="close-outline"
            onPress={() => navigation.goBack()}
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
});
