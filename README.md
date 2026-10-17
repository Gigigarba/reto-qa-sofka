# Reto técnico QA

Pruebas de OpenCart y PetStore con Playwright y JavaScript, y prueba de carga del login de FakeStore con JMeter.

## Herramientas utilizadas

- Windows, Node.js 24.22.0 y npm 11.2.0.
- Playwright 1.64.1, fijado en `package-lock.json`.
- Apache JMeter 5.6.3 y Java 8, versión `1.8.0_461`.

## Instalación

Desde la carpeta del proyecto:

```bat
npm ci
npx playwright install chromium
```

## Pruebas funcionales

PetStore: crear un usuario, consultarlo, actualizar nombre y correo, verificar los cambios, eliminarlo y comprobar que la consulta posterior devuelve 404.

```bat
npx playwright test tests/petstore.spec.js --project=chromium --workers=1
```

OpenCart: agregar HTC Touch HD y Canon EOS 5D en color rojo, validar el carrito y completar la compra como invitado.

```bat
npx playwright test tests/opencart.spec.js --project=chromium --workers=1 --headed
```

Para ejecutar ambos casos:

```bat
npx playwright test tests/petstore.spec.js tests/opencart.spec.js --project=chromium --workers=1
```

Los reportes de las ejecuciones entregadas se consultan con:

```bat
npx playwright show-report evidencias/api
npx playwright show-report evidencias/web
```

Ejecutar un comando a la vez y cerrar el servidor con Ctrl+C antes de abrir el otro reporte. Las nuevas ejecuciones generan su reporte en `playwright-report`; las evidencias entregadas permanecen en `evidencias`.

## Performance

La carpeta `performance` contiene los planes JMeter, las cinco credenciales del ejercicio, el analizador y los resultados.

- `login-validacion.jmx`: cinco solicitudes para comprobar las credenciales.
- `login-carga.jmx`: 50 hilos, arranque de 5 s, duración de 60 s y objetivo de 22 solicitudes/s.
- `resultados-carga-02.jtl`: registro de la ejecución completa.
- `reporte-carga-02/index.html`: dashboard de JMeter.
- `notas-ejecucion.txt`: resultados y registro del intento interrumpido.

Las instrucciones de ejecución están en `performance/readme.txt`.

La ejecución completa registró 1319 solicitudes, 21,894 TPS, máximo de 1309 ms y 0 % de errores. Cumple los requisitos de al menos 20 TPS, máximo de 1500 ms y menos del 3 % de errores.

`performance/InformeResultados.doc` contiene el análisis del segundo ejercicio, realizado sobre la tabla y la gráfica proporcionadas en el enunciado. También se incluye en formato DOCX.

## Observaciones

En el carrito de OpenCart se observó el título «Use Gift Certificate». Por eso el caso verifica la URL, la tabla, los productos y sus cantidades. La Canon requiere seleccionar el color antes de agregarla.

Las pruebas funcionales entregadas se ejecutaron en Chromium. Los resultados de carga corresponden a una ejecución de 60 s. El stock y la disponibilidad de estos sitios de demostración pueden cambiar.
