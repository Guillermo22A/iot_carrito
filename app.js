// ===================================================================
// 1. CONFIGURACIÓN INICIAL
// ===================================================================

// ⬇️ ⬇️ ⬇️ ¡¡¡ATENCIÓN!!! ⬇️ ⬇️ ⬇️
// REEMPLAZA "XX.XX.XX.XX" CON LA IP PÚBLICA DE TU INSTANCIA EC2.
const SERVIDOR_EC2_URL = "https://memo.micarrirobot.cc";
// ⬆️ ⬆️ ⬆️ ¡¡¡ATENCIÓN!!! ⬆️ ⬆️ ⬆️

const ID_DISPOSITIVO_ACTUAL = 1; // El ID del carrito que controlas

// --- Obtener elementos del DOM ---
const log = document.getElementById('monitor-log');
const conexionStatus = document.getElementById('conexion-status');

// --- IDs de Operación (Catálogo Completo) ---
const OP = {
  ADELANTE: 1,
  ATRAS: 2,
  DETENER: 3,
  VUELTA_AD_DER: 4,
  VUELTA_AD_IZQ: 5,
  VUELTA_AT_DER: 6,
  VUELTA_AT_IZQ: 7,
  GIRO_DER_90: 8,
  GIRO_IZQ_90: 9,
  GIRO_DER_360: 10,
  GIRO_IZQ_360: 11,
};

// --- Obtener TODOS los botones ---
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
});

socket.on('disconnect', () => {
  conexionStatus.textContent = 'Estado: Desconectado';
  conexionStatus.className = 'text-danger';
  agregarLog('Desconectado del servidor.', 'error');
});

socket.on('respuesta_conexion', (data) => {
  agregarLog(`Servidor dice: ${data.mensaje}`);
});

socket.on('error', (data) => {
  agregarLog(`Error del servidor: ${data.mensaje}`, 'error');
});

socket.on('actualizacion_global_status', (data) => {
  agregarLog(`[PUSH] Dispositivo ${data.id_dispositivo} ahora está: ${data.status_texto}`);
});

// ===================================================================
// 4. ENVIAR COMANDOS AL SERVIDOR (Socket.emit)
// ===================================================================

function enviarComando(idOperacion) {
  const data = {
    id_operacion: idOperacion,
    id_dispositivo: ID_DISPOSITIVO_ACTUAL
  };
  
  socket.emit('comando_desde_frontend', data);
  agregarLog(`Enviando comando: ${idOperacion}`, 'comando');
}

// --- Asignar eventos a TODOS los botones ---
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


// ===================================================================
// 5. OBTENER DATOS INICIALES (Fetch Async/Await)
// ===================================================================

async function cargarUltimosMovimientos() {
  agregarLog('Cargando historial (Fetch)...');
  try {
    const response = await fetch(`${SERVIDOR_EC2_URL}/api/movimientos/ultimos10`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const movimientos = await response.json();
    
    agregarLog('--- Historial Cargado ---', 'success');
    movimientos.forEach(mov => {
      agregarLog(`(Historial) ${mov.fecha}: ${mov.operacion}`);
    });
    
  } catch (error) {
    agregarLog(`Error con Fetch: ${error.message}`, 'error');
  }
}

document.addEventListener('DOMContentLoaded', cargarUltimosMovimientos);