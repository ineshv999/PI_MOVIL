import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const { login } = useAuth();

  const iniciarSesion = async () => {
    if (!usuario.trim() || !contrasena.trim()) {
      setMensaje({ type: 'warning', text: 'Ingresa tu usuario y contraseña.' });
      return;
    }

    try {
      setMensaje(null);
      setEnviando(true);
      await login(usuario, contrasena);
      navigation.replace('Dashboard');
    } catch (error) {
      setMensaje(error?.status === 401
        ? { type: 'error', text: 'Usuario o contraseña incorrectos. Verifica tus credenciales.' }
        : { type: 'warning', text: apiErrorMessage(error) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B0F0E"
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons
              name="shield-checkmark-outline"
              size={42}
              color="#22C55E"
            />
          </View>

          <Text style={styles.appName}>SGAFAQ</Text>

          <Text style={styles.appDescription}>
            Sistema de Gestión y Auditoría de Activos Fijos
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>// ACCESO AL SISTEMA</Text>

          <Text style={styles.title}>Iniciar sesión</Text>

          <Text style={styles.subtitle}>
            Ingresa tus credenciales institucionales
          </Text>

          {mensaje && (
            <View style={[styles.alertBanner, mensaje.type === 'warning' && styles.alertWarning]}>
              <Ionicons name={mensaje.type === 'warning' ? 'warning' : 'alert-circle'} size={20}
                color={mensaje.type === 'warning' ? '#F59E0B' : '#EF4136'} />
              <Text style={[styles.alertText, mensaje.type === 'warning' && styles.alertTextWarning]}>{mensaje.text}</Text>
            </View>
          )}

          <Text style={styles.label}>USUARIO</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={19}
              color="#8A9490"
            />

            <TextInput
              style={styles.input}
              value={usuario}
              onChangeText={(value) => { setUsuario(value); setMensaje(null); }}
              placeholder="Ingresa tu usuario"
              placeholderTextColor="#7B8581"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>CONTRASEÑA</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={19}
              color="#8A9490"
            />

            <TextInput
              style={styles.input}
              value={contrasena}
              onChangeText={(value) => { setContrasena(value); setMensaje(null); }}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#7B8581"
              secureTextEntry={!mostrarContrasena}
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() =>
                setMostrarContrasena(!mostrarContrasena)
              }
            >
              <Ionicons
                name={
                  mostrarContrasena
                    ? 'eye-off-outline'
                    : 'eye-outline'
                }
                size={20}
                color="#8A9490"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={iniciarSesion}
            disabled={enviando}
            activeOpacity={0.85}
          >
            {enviando && <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />}
            <Text style={styles.loginButtonText}>
              Iniciar sesión
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Universidad Politécnica de Querétaro
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F0E',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 35,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logo: {
    width: 78,
    height: 78,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12201A',
    borderWidth: 1,
    borderColor: '#224531',
    marginBottom: 13,
  },

  appName: {
    color: '#F2F4F3',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 2,
  },

  appDescription: {
    maxWidth: 280,
    color: '#8A9490',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },

  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: '#111715',
    borderWidth: 1,
    borderColor: '#26302D',
    borderRadius: 18,
    padding: 21,
  },

  eyebrow: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },

  title: {
    color: '#F2F4F3',
    fontSize: 24,
    fontWeight: '800',
  },

  subtitle: {
    color: '#8A9490',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 22,
  },

  alertBanner: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#F5C2BE',
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
  },

  alertWarning: {
    backgroundColor: '#FFF8E6',
    borderColor: '#F4D58A',
  },

  alertText: {
    flexGrow: 1,
    color: '#D9362B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  alertTextWarning: {
    color: '#A16207',
  },

  label: {
    color: '#A8B0AD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303A37',
    borderRadius: 10,
    backgroundColor: '#0B0F0E',
    paddingHorizontal: 13,
    marginBottom: 17,
  },

  input: {
    flex: 1,
    color: '#F2F4F3',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  loginButton: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 10,
    marginTop: 5,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 8,
  },

  footer: {
    color: '#66706C',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 22,
  },
});
