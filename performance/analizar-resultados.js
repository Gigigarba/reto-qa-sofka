const fs = require('node:fs');
const path = require('node:path');

// Lee CSV con campos entre comillas, comas y saltos de linea.
function leerCSV(texto) {
  const filas = [];
  let fila = [], campo = '', entreComillas = false;
  texto = texto.replace(/^\uFEFF/, '');
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"') {
      if (entreComillas && texto[i + 1] === '"') { campo += '"'; i++; }
      else entreComillas = !entreComillas;
    } else if (c === ',' && !entreComillas) {
      fila.push(campo); campo = '';
    } else if ((c === '\n' || c === '\r') && !entreComillas) {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo);
      if (fila.some(v => v !== '')) filas.push(fila);
      fila = []; campo = '';
    } else campo += c;
  }
  if (entreComillas) throw new Error('CSV incompleto: comillas sin cerrar.');
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const cabeceras = filas.shift();
  if (!cabeceras) throw new Error('El archivo no contiene resultados.');
  return filas.map((valores, indice) => {
    if (valores.length !== cabeceras.length) throw new Error(`Fila CSV ${indice + 2} incompleta.`);
    return Object.fromEntries(cabeceras.map((h, i) => [h, valores[i]]));
  });
}

try {
  const archivo = path.resolve(process.argv[2] || 'resultados.jtl');
  const todas = leerCSV(fs.readFileSync(archivo, 'utf8'));
  const filas = todas.filter(f => f.label === 'POST /auth/login');
  if (!filas.length) throw new Error('No hay muestras POST /auth/login.');
  for (const f of filas) {
    if (!['true', 'false'].includes(f.auth_ok)) {
      throw new Error('Falta auth_ok. Ejecuta JMeter con -Jsample_variables=auth_ok.');
    }
    if (!['true', 'false'].includes(f.success) || !Number.isFinite(Number(f.timeStamp)) || !Number.isFinite(Number(f.elapsed))) {
      throw new Error('Formato JTL no valido: se necesitan timeStamp en milisegundos, elapsed y success.');
    }
  }
  const tiempos = filas.map(f => Number(f.elapsed)).sort((a,b) => a-b);
  const inicio = Math.min(...filas.map(f => Number(f.timeStamp)));
  const fin = Math.max(...filas.map(f => Number(f.timeStamp) + Number(f.elapsed)));
  const segundos = (fin - inicio) / 1000;
  if (segundos <= 0) throw new Error('La ventana de medicion no tiene duracion positiva.');
  const erroresFuncionales = filas.filter(f => f.auth_ok !== 'true').length;
  const erroresJMeter = filas.filter(f => f.success !== 'true').length;
  const lentas = tiempos.filter(t => t > 1500).length;
  const tps = filas.length / segundos;
  const errorPct = 100 * erroresFuncionales / filas.length;
  const maximo = tiempos[tiempos.length - 1];
  const cumple = tps >= 20 && maximo <= 1500 && errorPct < 3;
  const datos = {
    archivo: path.basename(archivo), muestras: filas.length,
    ventanaMedicionSegundos: segundos, tps,
    tpsConAutenticacionValida: (filas.length - erroresFuncionales) / segundos,
    erroresFuncionales, porcentajeErrorFuncional: errorPct,
    erroresJMeter, porcentajeErrorJMeter: 100 * erroresJMeter / filas.length,
    promedioMs: tiempos.reduce((a,b) => a+b,0) / tiempos.length,
    p95Ms: tiempos[Math.ceil(tiempos.length * 0.95) - 1], maximoMs: maximo,
    solicitudesSobre1500Ms: lentas,
    criterios: { tpsMinimo20: tps >= 20, maximo1500Ms: maximo <= 1500, errorMenor3PorCiento: errorPct < 3 },
    cumple
  };
  const texto = [
    'RESULTADOS DE LA PRUEBA DE LOGIN - FAKESTORE',
    `Fuente: ${datos.archivo}`,
    `Solicitudes completadas: ${datos.muestras}`,
    `Ventana desde el inicio de la primera solicitud hasta el fin de la ultima: ${segundos.toFixed(3)} s`,
    `Throughput total observado: ${tps.toFixed(3)} TPS`,
    `Throughput con autenticacion valida: ${datos.tpsConAutenticacionValida.toFixed(3)} TPS`,
    `Errores de HTTP/token: ${erroresFuncionales} (${errorPct.toFixed(3)}%)`,
    `Errores totales de JMeter, incluidas aserciones: ${erroresJMeter} (${datos.porcentajeErrorJMeter.toFixed(3)}%)`,
    `Tiempo promedio: ${datos.promedioMs.toFixed(2)} ms`,
    `Percentil 95: ${datos.p95Ms} ms`,
    `Tiempo maximo: ${maximo} ms`,
    `Solicitudes que superaron 1500 ms: ${lentas}`,
    '',
    'CRITERIOS DEL EJERCICIO',
    `Al menos 20 TPS: ${datos.criterios.tpsMinimo20 ? 'CUMPLE' : 'NO CUMPLE'}`,
    `Tiempo de respuesta maximo de 1500 ms: ${datos.criterios.maximo1500Ms ? 'CUMPLE' : 'NO CUMPLE'}`,
    `Tasa de error funcional menor al 3%: ${datos.criterios.errorMenor3PorCiento ? 'CUMPLE' : 'NO CUMPLE'}`,
    '',
    `Conclusion: ${cumple ? 'la ejecucion cumple los tres criterios configurados.' : 'la ejecucion no cumple todos los criterios configurados; revisar los indicadores anteriores.'}`,
    'La tasa de error funcional considera HTTP distinto del codigo esperado (201 por defecto), JSON invalido o token vacio.',
    'La Duration Assertion tambien marca como fallidas las respuestas lentas; por eso se informa por separado el error total de JMeter.',
    'El requisito de 1,5 s se interpreto como maximo por solicitud, no como promedio ni p95.',
    'Los resultados corresponden a esta ejecucion y dependen tambien de la red y del equipo generador.',
    '',
    'Recomendacion: revisar las muestras fallidas del JTL y los tiempos del reporte antes de atribuir una causa al servidor.',
    ''
  ].join('\n');
  const carpeta = path.dirname(archivo);
  fs.writeFileSync(path.join(carpeta, 'conclusiones.txt'), texto, 'utf8');
  fs.writeFileSync(path.join(carpeta, 'resumen.json'), JSON.stringify(datos,null,2) + '\n', 'utf8');
  console.log(texto);
  process.exitCode = cumple ? 0 : 2;
} catch (error) {
  console.error(`No se pudo analizar el resultado: ${error.message}`);
  process.exitCode = 1;
}
