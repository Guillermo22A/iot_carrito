// ===================================================================
// 1. CONFIGURACIÓN INICIAL
// ===================================================================

const SERVIDOR_EC2_URL = "https://memo.micarrirobot.cc";
const ID_DISPOSITIVO_ACTUAL = 1;

// --- Obtener elementos del DOM ---
const log = document.getElementById('monitor-log');
const conexionStatus = document.getElementById('conexion-status');

// --- IDs de Operación (Catálogo Completo) ---
const OP = {
  ADELANTE: 1, ATRAS: 2, DETENER: 3, VUELTA_AD_DER: 4, VUELTA_AD_IZQ: 5,
  VUELTA_AT_DER: 6, VUELTA_AT_IZQ: 7, GIRO_DER_90: 8, GIRO_IZQ_90: 9,
  GIRO_DER_360: 10, GIRO_IZQ_360: 11,
};

// --- Botones de Movimiento ---
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

// --- Elementos de Demo (MODIFICADOS) ---
const btnEjecutarDemo = document.getElementById('btn-ejecutar-demo');
const selectDemo = document.getElementById('demo-select');

// --- Formulario de Crear Demo ---
const btnCrearDemo = document.getElementById('btn-crear-demo');
const inputDemoNombre = document.getElementById('demo-nombre');
const textareaDemoPasos = document.getElementById('demo-pasos'); // <-- TYPO CORREGIDO


// ===================================================================
// 2. CONEXIÓN CON EL SERVIDOR (WEBSOCKETS)
// ===================================================================

console.log(`Intentando conectar con el servidor en ${SERVIDOR_EC2_URL}`);
const socket = io(SERVIDOR_EC2_URL);

// --- Función para añadir mensajes al log ---
function agregarLog(mensaje, tipo = 'info') {
  const p = document.createElement('p');
  if (tipo === 'error') p.style.color = 'red';
  else if (tipo === 'success') p.style.color = 'green';
  else if (tipo === 'comando') p.style.color = 'blue';
  p.textContent = `[${new Date().toLocaleTimeString()}] ${mensaje}`;
  log.prepend(p);
}

// ===================================================================
// 3. ESCUCHAR EVENTOS "PUSH" DEL SERVIDOR (Socket.on)
// ===================================================================

socket.on('connect', () => {
  conexionStatus.textContent = 'Estado: Conectado';
  conexionStatus.className = 'text-success';
  agregarLog('¡Conectado al servidor con éxito!', 'success');
  // Una vez conectados, cargamos el historial y las demos
  cargarUltimosMovimientos();
  cargarDemosDisponibles();
});

socket.on('disconnect', () => {
  conexionStatus.textContent = 'Estado: Desconectado';
  conexionStatus.className = 'text-danger';
  agregarLog('Desconectado del servidor.', 'error');
});

socket.on('respuesta_conexion', (data) => agregarLog(`Servidor dice: ${data.mensaje}`));
socket.on('error', (data) => agregarLog(`Error del servidor: ${data.mensaje}`, 'error'));
socket.on('actualizacion_global_status', (data) => {
  agregarLog(`[PUSH] Dispositivo ${data.id_dispositivo} ahora está: ${data.status_texto}`);
});
socket.on('demo_completada', (data) => {
    agregarLog(`¡Demo "${data.nombre_demo}" (ID: ${data.id_secuencia}) completada!`, 'success');
});

// **NUEVO** Listener para actualizar la lista de demos cuando alguien más crea una
socket.on('nueva_demo_creada', (data) => {
    agregarLog(`¡Nueva demo disponible: "${data.nombre}"!`, 'success');
    // Añadimos la nueva demo al principio del dropdown
    const option = document.createElement('option');
    option.value = data.id;
    option.textContent = data.nombre;
    selectDemo.prepend(option);
});

// ===================================================================
// 4. ENVIAR COMANDOS AL SERVIDOR (Socket.emit)
// ===================================================================

function enviarComando(idOperacion) {
  const data = { id_operacion: idOperacion, id_dispositivo: ID_DISPOSITIVO_ACTUAL };
  socket.emit('comando_desde_frontend', data);
  agregarLog(`Enviando comando: ${idOperacion}`, 'comando');
}

// --- Asignar eventos a TODOS los botones de movimiento ---
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

// --- Asignar evento al botón de EJECUTAR DEMO (MODIFICADO) ---
btnEjecutarDemo.onclick = () => {
    const idDemo = selectDemo.value;
    const nombreDemo = selectDemo.options[selectDemo.selectedIndex].text;
    
    if (!idDemo) {
        agregarLog('Por favor, selecciona una demo válida.', 'error');
        return;
    }
    
    if (confirm(`¿Iniciar demo: "${nombreDemo}"?`)) {
        agregarLog(`Iniciando demo "${nombreDemo}" (ID: ${idDemo})...`, 'comando');
        socket.emit('ejecutar_demo', {
            id_secuencia: idDemo,
            id_dispositivo: ID_DISPOSITIVO_ACTUAL
        });
    }
};

// ===================================================================
// 5. OBTENER DATOS INICIALES (Fetch Async/Await)
// ===================================================================

async function cargarUltimosMovimientos() {
  agregarLog('Cargando historial (Fetch)...');
  try {
    const response = await fetch(`${SERVIDOR_EC2_URL}/api/movimientos/ultimos10`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const movimientos = await response.json();
    
    agregarLog('--- Historial Cargado ---', 'success');
    movimientos.forEach(mov => agregarLog(`(Historial) ${mov.fecha}: ${mov.operacion}`));
  } catch (error) {
    agregarLog(`Error con Fetch: ${error.message}`, 'error');
  }
}

// **NUEVA** Función para cargar las demos disponibles
async function cargarDemosDisponibles() {
    agregarLog('Cargando demos disponibles...');
    try {
        const response = await fetch(`${SERVIDOR_EC2_URL}/api/demos`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const demos = await response.json(); // demos = [{id: 1, nombre: "Demo 1"}]

        // Limpiar el dropdown
        selectDemo.innerHTML = '';
        
        if (demos.length === 0) {
            selectDemo.innerHTML = '<option value="">No hay demos creadas</option>';
            return;
        }

        // Llenar el dropdown
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

// =Impedimos que se carguen al inicio, ahora se cargan con el 'connect' de socket
// document.addEventListener('DOMContentLoaded', cargarUltimosMovimientos);
// document.addEventListener('DOMContentLoaded', cargarDemosDisponibles);


// ===================================================================
// 6. CREAR NUEVA DEMO (FETCH) - (TYPO CORREGIDO)
// ===================================================================

async function crearNuevaDemo() {
  const nombre = inputDemoNombre.value.trim();
  const pasosCrudos = textareaDemoPasos.value.trim(); // <-- TYPO CORREGIDO
  
  // Validación simple
  if (!nombre || !pasosCrudos) {
    agregarLog("Error: El nombre y los pasos son obligatorios.", 'error');
    return;
  }
  
  const pasosArray = pasosCrudos.split('\n')
                                .map(p => p.trim())
                                .filter(p => p.length > 0);
  
  if (pasosArray.length === 0) {
    agregarLog("Error: Debes añadir al menos un paso válido.", 'error');
    return;
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
      // Esta es la alerta de éxito que pediste
      agregarLog(`¡Demo "${nombre}" (ID: ${data.id_secuencia}) creada con éxito!`, 'success');
      // Limpiar el formulario
      inputDemoNombre.value = '';
      textareaDemoPasos.value = '';
      // No necesitamos llamar a cargarDemosDisponibles() porque
      // el servidor nos enviará un push 'nueva_demo_creada'
    } else {
      throw new Error(data.error || 'Error desconocido al crear la demo.');
    }
    
  } catch (error) {
    agregarLog(`Error al crear demo: ${error.message}`, 'error');
  }
}

// Asignar el evento al botón de crear
btnCrearDemo.onclick = crearNuevaDemo;