PRUEBA DE CARGA - LOGIN FAKESTORE

Herramientas: JMeter 5.6.3, Java 1.8.0_461 y Node.js 24.22.0.
Endpoint: POST https://fakestoreapi.com/auth/login
Datos: cinco credenciales de demostración incluidas en usuarios.csv.

VALIDACIÓN DE CREDENCIALES
Abrir login-validacion.jmx en JMeter y ejecutar. El plan hace cinco solicitudes y comprueba HTTP 201, JSON válido y token no vacío. El 201 corresponde al código observado durante la ejecución.

CONFIGURACIÓN DE CARGA
- 50 hilos y arranque gradual de 5 segundos.
- Duración configurada: 60 segundos, incluido el arranque.
- Constant Throughput Timer compartido: 1320 solicitudes/minuto, equivalente a 22 TPS de objetivo.
- Una solicitud de login por iteración. El CSV se reutiliza durante la carga.
- Validación de HTTP y token, más una aserción de duración máxima de 1500 ms.

EJECUCIÓN
Mantener los JMX y usuarios.csv en la misma carpeta. Para usar los siguientes comandos en CMD, agregar primero la carpeta bin de JMeter al PATH, o invocar jmeter.bat con su ruta completa entre comillas.

Desde la carpeta performance:

jmeter.bat -n -t login-carga.jmx -l resultados.jtl -e -o reporte -Jsample_variables=auth_ok -Jjmeter.save.saveservice.output_format=csv -Jjmeter.save.saveservice.print_field_names=true -Jjmeter.save.saveservice.timestamp_format=ms
node analizar-resultados.js resultados.jtl

Usar un archivo JTL nuevo y una carpeta de reporte nueva en cada ejecución. El analizador genera conclusiones.txt y resumen.json junto al JTL, reemplazando los resúmenes anteriores de esa carpeta.

RESULTADOS ENTREGADOS
Archivo: resultados-carga-02.jtl.
Dashboard: reporte-carga-02/index.html.
1319 solicitudes, 21,894 TPS, promedio de 372,67 ms, p95 de 461 ms y máximo de 1309 ms. Cero errores de HTTP/token y cero errores totales de JMeter.

Los tres criterios se cumplen en esta ejecución: al menos 20 TPS, máximo de 1500 ms y error menor al 3 %.

El campo auth_ok registra el resultado de la validación de HTTP/token. El campo success de JMeter incluye también los fallos por duración. Ambos porcentajes se presentan por separado. El objetivo configurado de 22 TPS se comprueba con el throughput medido; 50 hilos no equivalen a 50 TPS.

El intento resultados-carga-01.jtl fue interrumpido y se conserva como antecedente. Su detalle está en notas-ejecucion.txt.

SEGUNDO EJERCICIO
InformeResultados.doc e InformeResultados.docx analizan la tabla y la gráfica entregadas en el enunciado. Sus cifras pertenecen a ese material, no a esta prueba de login.
