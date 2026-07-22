import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import HistorialScreen from './screens/HistorialScreen';
import EscanearScreen from './screens/EscanearScreen';
import RegistrarUsuarioScreen from './screens/RegistrarUsuarioScreen';
import RegistrarActivoScreen from './screens/RegistrarActivoScreen';
import GestionarUsuariosScreen from './screens/GestionarUsuariosScreen';
import InventarioGeneralScreen from './screens/InventarioGeneralScreen';

import AuditoriasScreen from './screens/AuditoriasScreen';
import CrearAuditoriaScreen from './screens/CrearAuditoriaScreen';
import EditarAuditoriaScreen from './screens/EditarAuditoriaScreen';
import AuditoriaEnCursoScreen from './screens/AuditoriaEnCursoScreen';
import DetalleAuditoriaScreen from './screens/DetalleAuditoriaScreen';
import RevisarActivoScreen from './screens/RevisarActivoScreen';
import ConsultarActivoScreen from './screens/ConsultarActivoScreen';
import ResultadosAuditoriaScreen from './screens/ResultadosAuditoriaScreen';
import { AuthProvider, useAuth } from './context/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return <SafeAreaProvider><AuthProvider><AppNavigator /></AuthProvider></SafeAreaProvider>;
}

function AppNavigator() {
  const { loading, isAdmin } = useAuth();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0F0E' }}><ActivityIndicator size="large" color="#22C55E" /></View>;
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
        />

        <Stack.Screen
          name="Historial"
          component={HistorialScreen}
        />

        <Stack.Screen
          name="Escanear"
          component={EscanearScreen}
        />

        {isAdmin && <Stack.Screen
          name="RegistrarUsuario"
          component={RegistrarUsuarioScreen}
        />}

        <Stack.Screen
          name="RegistrarActivo"
          component={RegistrarActivoScreen}
        />

        {isAdmin && <Stack.Screen
          name="GestionarUsuarios"
          component={GestionarUsuariosScreen}
        />}

        <Stack.Screen
          name="InventarioGeneral"
          component={InventarioGeneralScreen}
        />

        <Stack.Screen
          name="Auditorias"
          component={AuditoriasScreen}
        />

        <Stack.Screen
          name="CrearAuditoria"
          component={CrearAuditoriaScreen}
        />

        <Stack.Screen
          name="EditarAuditoria"
          component={EditarAuditoriaScreen}
        />

        <Stack.Screen
          name="AuditoriaEnCurso"
          component={AuditoriaEnCursoScreen}
        />

        <Stack.Screen
          name="DetalleAuditoria"
          component={DetalleAuditoriaScreen}
        />

        <Stack.Screen
          name="RevisarActivo"
          component={RevisarActivoScreen}
        />

        <Stack.Screen
          name="ConsultarActivo"
          component={ConsultarActivoScreen}
        />

        <Stack.Screen
          name="ResultadosAuditoria"
          component={ResultadosAuditoriaScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
