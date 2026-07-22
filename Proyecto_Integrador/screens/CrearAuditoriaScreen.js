import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppShell from '../components/AppShell';
import { apiErrorMessage, endpoints } from '../services/api';
import { colors, Card, PageHeading, PrimaryButton, SecondaryButton } from '../components/ScreenUI';

const empty = { titulo: '', descripcion: '', fecha: '', responsableId: '', edificioId: '', ubicacionDetalle: '' };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function CrearAuditoriaScreen({ navigation }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [calendar, setCalendar] = useState(false);
  const [month, setMonth] = useState(new Date(today().getFullYear(), today().getMonth(), 1));
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    Promise.all([endpoints.users(), endpoints.buildings()])
      .then(([userData, buildingData]) => { setUsers(userData.filter((item) => item.activo)); setBuildings(buildingData); })
      .catch((error) => setErrors({ general: apiErrorMessage(error) }));
  }, []);

  const change = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null, general: null }));
  };
  const validate = () => {
    const next = {};
    if (form.titulo.trim().length < 3) next.titulo = 'El nombre de la auditoría es requerido (mínimo 3 caracteres)';
    if (form.descripcion.trim().length < 5) next.descripcion = 'Describe el objetivo y alcance de la auditoría';
    if (!form.fecha) next.fecha = 'Selecciona una fecha programada';
    else if (new Date(`${form.fecha}T00:00:00`) < today()) next.fecha = 'La fecha no puede ser anterior al día actual';
    if (!form.responsableId) next.responsableId = 'Selecciona un responsable';
    if (!form.edificioId) next.edificioId = 'Selecciona el edificio que será auditado';
    if (form.ubicacionDetalle.length > 180) next.ubicacionDetalle = 'El detalle no puede superar 180 caracteres';
    setErrors(next); return Object.keys(next).length === 0;
  };
  const save = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const audit = await endpoints.createAudit({
        titulo: form.titulo.trim(), descripcion: form.descripcion.trim(), responsable_id: +form.responsableId,
        edificio_id: +form.edificioId, ubicacion_detalle: form.ubicacionDetalle.trim() || null,
        fecha_programada: `${form.fecha}T09:00:00-06:00`, activo_ids: [],
      });
      setCreated(audit);
    } catch (error) { setErrors({ general: apiErrorMessage(error) }); }
    finally { setSaving(false); }
  };
  const closeSuccess = () => { setCreated(null); setForm(empty); navigation.goBack(); };

  return <AppShell navigation={navigation} title="Crear auditoría" activeRoute="Auditorias">
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={19} color={colors.textSecondary} /><Text style={styles.backText}>Regresar a auditorías</Text></TouchableOpacity>
      <PageHeading eyebrow="// NUEVA AUDITORÍA" title="Crear auditoría" subtitle="Programa una revisión; se incluirán exclusivamente los activos del edificio seleccionado." />
      {errors.general && <View style={styles.banner}><Ionicons name="alert-circle" size={19} color={colors.danger} /><Text style={styles.bannerText}>{errors.general}</Text></View>}
      <Card>
        <Field label="NOMBRE DE LA AUDITORÍA *" icon="clipboard-outline" value={form.titulo} onChange={(v) => change('titulo', v)} error={errors.titulo} placeholder="Ej. Auditoría de inventario" maxLength={120} />
        <Field label="DESCRIPCIÓN / OBJETIVO *" value={form.descripcion} onChange={(v) => change('descripcion', v)} error={errors.descripcion} placeholder="Describe el objetivo y alcance de la auditoría" maxLength={500} multiline counter />
        <Text style={styles.label}>FECHA PROGRAMADA *</Text>
        <TouchableOpacity style={[styles.inputBox, errors.fecha && styles.invalid]} onPress={() => setCalendar(true)}><Ionicons name="calendar-outline" size={20} color={colors.textSecondary} /><Text style={[styles.dateText, !form.fecha && styles.placeholder]}>{form.fecha || 'Seleccionar desde el calendario'}</Text></TouchableOpacity>
        {errors.fecha && <Text style={styles.error}>{errors.fecha}</Text>}
        <Choice label="RESPONSABLE *" value={form.responsableId} error={errors.responsableId} onChange={(v) => change('responsableId', v)} placeholder="Selecciona un administrador o auditor"
          items={users.map((item) => [String(item.id), `${item.nombres} ${item.apellidos} · ${item.rol === 'administrador' ? 'Administrador' : 'Auditor'}`])} />
        <Choice label="EDIFICIO / UBICACIÓN *" value={form.edificioId} error={errors.edificioId} onChange={(v) => change('edificioId', v)} placeholder="Selecciona el edificio a revisar"
          items={buildings.map((item) => [String(item.id), item.nombre])} />
        <Field label="DETALLE DE UBICACIÓN O COMENTARIO (OPCIONAL)" icon="location-outline" value={form.ubicacionDetalle} onChange={(v) => change('ubicacionDetalle', v)} error={errors.ubicacionDetalle} placeholder="Ej. Laboratorio 1, segundo piso o indicaciones específicas" maxLength={180} />
        <View style={styles.scopeNotice}><Ionicons name="information-circle-outline" size={19} color={colors.accentDark} /><Text style={styles.scopeText}>Esta auditoría solo permitirá revisar activos registrados en el edificio seleccionado.</Text></View>
        <PrimaryButton title={saving ? 'Creando auditoría...' : 'Crear auditoría'} icon="checkmark-circle-outline" onPress={save} disabled={saving} />
        <SecondaryButton title="Cancelar" icon="close-outline" onPress={() => navigation.goBack()} />
      </Card>
    </ScrollView>
    <CalendarModal visible={calendar} month={month} setMonth={setMonth} selected={form.fecha} onClose={() => setCalendar(false)} onSelect={(date) => { change('fecha', isoDate(date)); setCalendar(false); }} />
    <Modal visible={!!created} transparent animationType="fade" onRequestClose={closeSuccess}><View style={styles.overlay}><View style={styles.successModal}>
      <View style={styles.successCircle}><Ionicons name="checkmark-circle-outline" size={42} color={colors.accentDark} /></View>
      <Text style={styles.successTag}>REGISTRO EXITOSO</Text><Text style={styles.successTitle}>¡Auditoría registrada!</Text>
      <Text style={styles.successText}>La auditoría <Text style={styles.bold}>{created?.titulo}</Text> fue programada correctamente con {created?.total_activos ?? 0} activos del edificio seleccionado.</Text>
      <PrimaryButton title="Ver auditorías" icon="shield-checkmark-outline" onPress={closeSuccess} />
      <SecondaryButton title="Cerrar" icon="close-outline" onPress={closeSuccess} />
    </View></View></Modal>
  </AppShell>;
}

function Field({ label, icon, value, onChange, error, placeholder, multiline, maxLength, counter }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={[styles.inputBox, multiline && styles.areaBox, error && styles.invalid]}>{icon && <Ionicons name={icon} size={20} color={colors.textSecondary} />}<TextInput style={[styles.input, multiline && styles.area]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.placeholder} multiline={multiline} maxLength={maxLength} textAlignVertical={multiline ? 'top' : 'center'} /></View>
    {counter && <Text style={styles.counter}>{value.length}/{maxLength}</Text>}{error && <Text style={styles.error}>{error}</Text>}</View>;
}
function Choice({ label, items, value, onChange, error, placeholder }) {
  const [open, setOpen] = useState(false); const selected = items.find(([id]) => id === value);
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TouchableOpacity style={[styles.inputBox, error && styles.invalid]} onPress={() => setOpen(!open)}><Text style={[styles.choiceValue, !selected && styles.placeholder]}>{selected?.[1] || placeholder}</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} /></TouchableOpacity>
    {open && <View style={styles.options}>{items.map(([id, name]) => <TouchableOpacity key={id} style={[styles.option, id === value && styles.optionSelected]} onPress={() => { onChange(id); setOpen(false); }}><Text style={styles.optionText}>{name}</Text>{id === value && <Ionicons name="checkmark" size={17} color={colors.accentDark} />}</TouchableOpacity>)}</View>}
    {error && <Text style={styles.error}>{error}</Text>}</View>;
}
function CalendarModal({ visible, month, setMonth, selected, onClose, onSelect }) {
  const days = useMemo(() => { const first = new Date(month.getFullYear(), month.getMonth(), 1); const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]; }, [month]);
  const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; const monthName = month.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.calendarCard}>
    <View style={styles.calendarHeader}><TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Ionicons name="chevron-back" size={25} /></TouchableOpacity><Text style={styles.monthName}>{monthName}</Text><TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={25} /></TouchableOpacity></View>
    <View style={styles.week}>{names.map((name) => <Text key={name} style={styles.weekName}>{name}</Text>)}</View><View style={styles.days}>{days.map((date, index) => { const disabled = date && date < today(); const chosen = date && isoDate(date) === selected; return <View key={index} style={styles.dayCell}>{date && <TouchableOpacity disabled={disabled} style={[styles.day, chosen && styles.chosenDay]} onPress={() => onSelect(date)}><Text style={[styles.dayText, disabled && styles.disabledDay, chosen && styles.chosenText]}>{date.getDate()}</Text></TouchableOpacity>}</View>; })}</View>
    <SecondaryButton title="Cerrar calendario" icon="close-outline" onPress={onClose} />
  </View></View></Modal>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 50 }, back: { flexDirection: 'row', gap: 7, alignItems: 'center', marginBottom: 18 }, backText: { color: colors.textSecondary, fontWeight: '700' },
  field: { marginBottom: 17 }, label: { color: colors.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: .7, marginBottom: 8 },
  inputBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background },
  input: { flex: 1, minHeight: 48, color: colors.textPrimary, outlineStyle: 'none' }, areaBox: { minHeight: 125, alignItems: 'flex-start', paddingTop: 4 }, area: { minHeight: 115 }, invalid: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 11, fontWeight: '800', marginTop: 5 }, counter: { color: colors.placeholder, fontSize: 10, textAlign: 'right', marginTop: 4 },
  dateText: { flex: 1, color: colors.textPrimary, fontSize: 14 }, placeholder: { color: colors.placeholder }, choiceValue: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  options: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden', marginTop: 5 }, option: { minHeight: 46, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }, optionSelected: { backgroundColor: colors.accentSoft }, optionText: { color: colors.textPrimary, fontSize: 13, flex: 1 },
  banner: { flexDirection: 'row', gap: 9, padding: 13, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: '#F3C6C6', borderRadius: 9, marginBottom: 15 }, bannerText: { flex: 1, color: colors.danger, fontWeight: '700' },
  scopeNotice: { flexDirection: 'row', gap: 8, padding: 13, backgroundColor: colors.accentSoft, borderRadius: 10, marginBottom: 18 }, scopeText: { flex: 1, color: colors.accentDark, fontSize: 11, lineHeight: 17, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(8,15,13,.7)', alignItems: 'center', justifyContent: 'center', padding: 18 }, successModal: { width: '100%', maxWidth: 460, backgroundColor: '#fff', borderRadius: 22, padding: 25, alignItems: 'center', borderTopWidth: 4, borderTopColor: colors.accent },
  successCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, successTag: { color: colors.accentDark, fontSize: 10, fontWeight: '900' }, successTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 8 }, successText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginVertical: 16 }, bold: { color: colors.textPrimary, fontWeight: '800' },
  calendarCard: { width: '100%', maxWidth: 410, backgroundColor: '#fff', borderRadius: 20, padding: 20 }, calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, monthName: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', textTransform: 'capitalize' }, week: { flexDirection: 'row' }, weekName: { width: '14.285%', textAlign: 'center', color: colors.textSecondary, fontSize: 11, fontWeight: '800' }, days: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }, dayCell: { width: '14.285%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }, day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, chosenDay: { backgroundColor: colors.accent }, dayText: { color: colors.textPrimary, fontWeight: '700' }, disabledDay: { color: '#D1D5DB' }, chosenText: { color: '#fff' },
});
