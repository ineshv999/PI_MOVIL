import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
import ResultadosAuditoriaScreen from './screens/ResultadosAuditoriaScreen';

const Stack = createNativeStackNavigator();

export default function App() {
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

        <Stack.Screen
          name="RegistrarUsuario"
          component={RegistrarUsuarioScreen}
        />

        <Stack.Screen
          name="RegistrarActivo"
          component={RegistrarActivoScreen}
        />

        <Stack.Screen
          name="GestionarUsuarios"
          component={GestionarUsuariosScreen}
        />

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
          name="ResultadosAuditoria"
          component={ResultadosAuditoriaScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}