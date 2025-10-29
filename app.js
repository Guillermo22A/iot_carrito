// ===================================================================
// 1. CONFIGURACIÓN GLOBAL
// ===================================================================
const SERVIDOR_EC2_URL = "https://memo.micarrirobot.cc";
let ID_DISPOSITIVO_ACTUAL = null; // ¡Ahora es dinámico!

// IDs de Operación
const OP = {
  ADELANTE: 1, ATRAS: 2, DETENER: 3, VUELTA_AD_DER: 4, VUELTA_AD_IZQ: 5,
  VUELTA_AT_DER: 6, VUELTA_AT_IZQ: 7, GIRO_DER_90: 8, GIRO_IZQ_90: 9,
  GIRO_DER_360: 10, GIRO_IZQ_360: 11,
};


// ===================================================================
// 2. LÓGICA DE LA APLICACIÓN
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- Obtener elementos del DOM ---
    const log = document.getElementById('monitor-log');
    const conexionStatus = document.getElementById('conexion-status');

    // --- NUEVO: Gestión de Dispositivos ---
    const selectDevice = document.getElementById('device-select');
    const inputDeviceNombre = document.getElementById('device-nombre-nuevo');
    const inputDeviceIp = document.getElementById('device-ip-nuevo');
    const btnCrearDispositivo = document.getElementById('btn-crear-dispositivo');
    const panelControlTitulo = document.getElementById('panel-control-titulo');

    // Botones de Movimiento
    const btnAdelante = document.getElementById('btn-adelante');
    const btnAtras = document.getElementById('btn-atras');
    const btnDetener = document.getElementById('btn-detener');
    const btnVueltaAdIzq = document.getElementById('btn-vuelta-ad-izq');
    const btnVueltaAdDer = document.getElementById('btn-vuelta-ad-der');
    const btnVueltaAtIzq = document.getElementById('btn-vuelta-at-izq');
    const btnVueltaAtDer = document.getElementById('btn-vuelta-at-der');
    const btnGiroIzq90 = document.getElementById('btn-giro-izq-90');
    const btnGiroDer90 = document.getElementById('btn-giro-der-90');
    const btnGiroIzq360 = document.getElementById('btn-giro-izq-360');
    const btnGiroDer360 = document.getElementById('btn-giro-der-360');

    // Elementos de Demo
    const btnEjecutarDemo = document.getElementById('btn-ejecutar-demo');
    const selectDemo = document.getElementById('demo-select');

    // Formulario de Crear Demo
    const btnCrearDemo = document.getElementById('btn-crear-demo');
    const inputDemoNombre = document.getElementById('demo-nombre');
    const textareaDemoPasos = document.getElementById('demo-pasos');


    // ===================================================================
    // 3. CONEXIÓN CON EL SERVIDOR (WEBSOCKETS)
    // ===================================================================

    console.log(`Intentando conectar con el servidor en ${SERVIDOR_EC2_URL}`);
    const socket = io(SERVIDOR_EC2_URL);

    function agregarLog(mensaje, tipo = 'info') {
      const p = document.createElement('p');
      if (tipo === 'error') p.style.color = 'red';
      else if (tipo === 'success') p.style.color = 'green';
      else if (tipo === 'comando') p.style.color = 'blue';
      p.textContent = `[${new Date().toLocaleTimeString()}] ${mensaje}`;
      log.prepend(p);
    }

    // ===================================================================
    // 4. ESCUCHAR EVENTOS "PUSH" DEL SERVIDOR (Socket.on)
    // ===================================================================

    socket.on('connect', () => {
      conexionStatus.textContent = 'Estado: Conectado';
      conexionStatus.className = 'text-success';
      agregarLog('¡Conectado al servidor con éxito!', 'success');
      // Cargar todo al conectar
      cargarUltimosMovimientos();
      cargarDemosDisponibles();
      cargarDispositivos(); // ¡NUEVO!
    });

    socket.on('disconnect', () => {
      conexionStatus.textContent = 'Estado: Desconectado';
      conexionStatus.className = 'text-danger';
      agregarLog('Desconectado del servidor.', 'error');
    });

    socket.on('respuesta_conexion', (data) => agregarLog(`Servidor dice: ${data.mensaje}`));
    socket.on('error', (data) => agregarLog(`Error del servidor: ${data.mensaje}`, 'error'));
    socket.on('actualizacion_global_status', (data) => {
      // Ahora solo mostramos logs del dispositivo seleccionado
      if (data.id_dispositivo == ID_DISPOSITIVO_ACTUAL) {
        agregarLog(`[PUSH] Dispositivo ${data.id_dispositivo} ahora está: ${data.status_texto}`);
      }
    });
    socket.on('demo_completada', (data) => {
        agregarLog(`¡Demo "${data.nombre_demo}" (ID: ${data.id_secuencia}) completada!`, 'success');
    });
    socket.on('nueva_demo_creada', (data) => {
        agregarLog(`¡Nueva demo disponible: "${data.nombre}"!`, 'success');
        const option = document.createElement('option');
        option.value = data.id;
        option.textContent = data.nombre;
        selectDemo.prepend(option);
    });
    
    // --- ¡NUEVO LISTENER! ---
    socket.on('nuevo_dispositivo_creado', (data) => {
        agregarLog(`¡Nuevo dispositivo registrado: "${data.nombre}"!`, 'success');
        const option = document.createElement('option');
        option.value = data.id;
        option.textContent = data.nombre;
        selectDevice.appendChild(option); // Añadir al dropdown
    });


    // ===================================================================
    // 5. ENVIAR COMANDOS AL SERVIDOR (Socket.emit)
    // ===================================================================

    function enviarComando(idOperacion) {
      // ¡Validación Clave!
      if (!ID_DISPOSITIVO_ACTUAL) {
        agregarLog("Error: No hay ningún dispositivo seleccionado.", 'error');
        alert("Por favor, selecciona un dispositivo activo en el panel de 'Gestión de Dispositivos'.");
        return;
      }
      
      const data = { 
        id_operacion: idOperacion, 
        id_dispositivo: ID_DISPOSITIVO_ACTUAL // Usar la variable dinámica
      };
      
      socket.emit('comando_desde_frontend', data);
      agregarLog(`Enviando comando: ${idOperacion} a Disp: ${ID_DISPOSITIVO_ACTUAL}`, 'comando');
    }

    // --- Asignar eventos a botones de movimiento (Sin cambios) ---
    btnAdelante.onclick = () => enviarComando(OP.ADELANTE);
    btnAtras.onclick = () => enviarComando(OP.ATRAS);
    btnDetener.onclick = () => enviarComando(OP.DETENER);
    btnVueltaAdIzq.onclick = () => enviarComando(OP.VUELTA_AD_IZQ);
    btnVueltaAdDer.onclick = () => enviarComando(OP.VUELTA_AD_DER);
    btnVueltaAtIzq.onclick = () => enviarComando(OP.VUELTA_AT_IZQ);
    btnVueltaAtDer.onclick = () => enviarComando(OP.VUELTA_AT_DER);
    btnGiroIzq90.onclick = () => enviarComando(OP.GIRO_IZQ_90);
    btnGiroDer90.onclick = () => enviarComando(OP.GIRO_DER_90);
    btnGiroIzq360.onclick = () => enviarComando(OP.GIRO_IZQ_360);
    btnGiroDer360.onclick = () => enviarComando(OP.GIRO_DER_360);

    // --- Asignar evento al botón de EJECUTAR DEMO ---
    btnEjecutarDemo.onclick = () => {
        const idDemo = selectDemo.value;
        const nombreDemo = selectDemo.options[selectDemo.selectedIndex].text;
        
        // ¡Validación Clave!
        if (!ID_DISPOSITIVO_ACTUAL) {
            agregarLog("Error: No hay ningún dispositivo seleccionado.", 'error');
            alert("Por favor, selecciona un dispositivo activo primero.");
            return;
        }
        if (!idDemo) {
            agregarLog('Por favor, selecciona una demo válida.', 'error');
            return;
        }
        
        if (confirm(`¿Iniciar demo: "${nombreDemo}" en el Dispositivo ${ID_DISPOSITIVO_ACTUAL}?`)) {
            agregarLog(`Iniciando demo "${nombreDemo}" (ID: ${idDemo})...`, 'comando');
            socket.emit('ejecutar_demo', {
                id_secuencia: idDemo,
                id_dispositivo: ID_DISPOSITIVO_ACTUAL // Usar la variable dinámica
            });
        }
    };

    // ===================================================================
    // 6. OBTENER DATOS INICIALES (Fetch Async/Await)
    // ===================================================================

    async function cargarUltimosMovimientos() {
      agregarLog('Cargando historial (Fetch)...');
      try {
        const response = await fetch(`${SERVIDOR_EC2_URL}/api/movimientos/ultimos10`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const movimientos = await response.json();
        agregarLog('--- Historial Cargado ---', 'success');
        movimientos.forEach(mov => agregarLog(`(Historial) Disp ${mov.dispositivo} - ${mov.fecha}: ${mov.operacion}`));
      } catch (error) {
        agregarLog(`Error con Fetch: ${error.message}`, 'error');
      }
    }

    async function cargarDemosDisponibles() {
        agregarLog('Cargando demos disponibles...');
        try {
            const response = await fetch(`${SERVIDOR_EC2_URL}/api/demos`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const demos = await response.json();
            selectDemo.innerHTML = '';
            if (demos.length === 0) {
                selectDemo.innerHTML = '<option value="">No hay demos creadas</option>';
                return;
            }
            demos.forEach(demo => {
                const option = document.createElement('option');
                option.value = demo.id;
                option.textContent = demo.nombre;
                selectDemo.appendChild(option);
            });
            agregarLog('Lista de demos actualizada.', 'success');
        } catch (error) {
            agregarLog(`Error al cargar demos: ${error.message}`, 'error');
            selectDemo.innerHTML = '<option value="">Error al cargar</option>';
        }
    }
    
    // --- ¡NUEVA FUNCIÓN! ---
    async function cargarDispositivos() {
        agregarLog('Cargando dispositivos registrados...');
        try {
            const response = await fetch(`${SERVIDOR_EC2_URL}/api/dispositivos`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const dispositivos = await response.json(); // [{id: 1, nombre: "Carrito Alfa"}]

            selectDevice.innerHTML = ''; // Limpiar dropdown
            selectDevice.innerHTML = '<option value="">-- Selecciona un Dispositivo --</option>';
            
            if (dispositivos.length === 0) {
                selectDevice.innerHTML = '<option value="">No hay dispositivos</option>';
                return;
            }

            dispositivos.forEach(dev => {
                const option = document.createElement('option');
                option.value = dev.id;
                option.textContent = dev.nombre;
                selectDevice.appendChild(option);
            });
            agregarLog('Lista de dispositivos actualizada.', 'success');

        } catch (error) {
            agregarLog(`Error al cargar dispositivos: ${error.message}`, 'error');
            selectDevice.innerHTML = '<option value="">Error al cargar</option>';
        }
    }


    // ===================================================================
    // 7. CREAR NUEVOS OBJETOS (Fetch)
    // ===================================================================

    async function crearNuevaDemo() {
      const nombre = inputDemoNombre.value.trim();
      const pasosCrudos = textareaDemoPasos.value.trim();
      
      if (!nombre || !pasosCrudos) {
        agregarLog("Error: El nombre y los pasos son obligatorios.", 'error'); return;
      }
      const pasosArray = pasosCrudos.split('\n').map(p => p.trim()).filter(p => p.length > 0);
      if (pasosArray.length === 0) {
        agregarLog("Error: Debes añadir al menos un paso válido.", 'error'); return;
      }

      agregarLog(`Creando demo: ${nombre}...`, 'comando');
      try {
        const response = await fetch(`${SERVIDOR_EC2_URL}/api/demos/crear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nombre, pasos: pasosArray }),
        });
        const data = await response.json();
        if (response.ok) {
          agregarLog(`¡Demo "${nombre}" (ID: ${data.id_secuencia}) creada con éxito!`, 'success');
          inputDemoNombre.value = '';
          textareaDemoPasos.value = '';
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
      } catch (error) {
        agregarLog(`Error al crear demo: ${error.message}`, 'error');
      }
    }
    
    // --- ¡NUEVA FUNCIÓN! ---
    async function crearNuevoDispositivo() {
        const nombre = inputDeviceNombre.value.trim();
        const ip = inputDeviceIp.value.trim() || null; // Enviar null si está vacío

        if (!nombre) {
            agregarLog("Error: El nombre del dispositivo es obligatorio.", 'error');
            return;
        }

        agregarLog(`Registrando dispositivo: ${nombre}...`, 'comando');
        try {
            const response = await fetch(`${SERVIDOR_EC2_URL}/api/dispositivos/crear`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nombre: nombre, ip: ip }),
            });
            const data = await response.json();

            if (response.ok) {
              agregarLog(`¡Dispositivo "${nombre}" (ID: ${data.dispositivo.id}) creado con éxito!`, 'success');
              // Limpiar formulario
              inputDeviceNombre.value = '';
              inputDeviceIp.value = '';
              // No necesitamos recargar, el evento push 'nuevo_dispositivo_creado' lo hará
            } else {
              throw new Error(data.error || 'Error desconocido');
            }
        } catch (error) {
            agregarLog(`Error al crear dispositivo: ${error.message}`, 'error');
        }
    }

    // ===================================================================
    // 8. ASIGNACIÓN DE EVENTOS (LISTENERS)
    // ===================================================================
    
    btnCrearDemo.onclick = crearNuevaDemo;
    btnCrearDispositivo.onclick = crearNuevoDispositivo; // ¡NUEVO!

    // --- ¡NUEVO! Listener para el dropdown de dispositivos ---
    selectDevice.onchange = (e) => {
        ID_DISPOSITIVO_ACTUAL = e.target.value; // Actualizar la variable global
        if (ID_DISPOSITIVO_ACTUAL) {
            const nombreDisp = e.target.options[e.target.selectedIndex].text;
            panelControlTitulo.textContent = `Panel de Control (Activo: ${nombreDisp})`;
            agregarLog(`Dispositivo ${nombreDisp} (ID: ${ID_DISPOSITIVO_ACTUAL}) seleccionado.`, 'success');
        } else {
            panelControlTitulo.textContent = 'Panel de Control (Selecciona un dispositivo)';
        }
    };

}); // <-- FIN DEL WRAPPER DOMCONTENTLOADED