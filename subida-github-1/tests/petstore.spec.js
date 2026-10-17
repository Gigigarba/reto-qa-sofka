const { test, expect } = require('@playwright/test');

test('PetStore: crear, consultar, actualizar y eliminar usuario', async ({
  request
}, testInfo) => {
  test.setTimeout(90000);

  const baseURL = 'https://petstore.swagger.io/v2';
  const id = Date.now();
  const username = `gigi_qa_${id}_${Math.random().toString(36).slice(2, 7)}`;
  const userURL = `${baseURL}/user/${username}`;

  const usuario = {
    id,
    username,
    firstName: 'Gigi',
    lastName: 'Pruebas',
    email: 'gigi.qa@example.com',
    password: 'DemoQA_2026!',
    phone: '0000000000',
    userStatus: 1
  };

  const actualizado = {
    ...usuario,
    firstName: 'Gigi Actualizada',
    email: 'gigi.actualizada@example.com'
  };

  // Guarda cada respuesta como evidencia y comprueba el código HTTP.
  async function comprobar(respuesta, codigoEsperado, nombre) {
    const texto = await respuesta.text();

    await testInfo.attach(nombre, {
      body: JSON.stringify({
        codigoHTTP: respuesta.status(),
        respuesta: texto
      }, null, 2),
      contentType: 'application/json'
    });

    expect(
      respuesta.status(),
      `${nombre}: ${texto}`
    ).toBe(codigoEsperado);

    return JSON.parse(texto);
  }

  await testInfo.attach('Datos de entrada', {
    body: JSON.stringify({ usuario, actualizado }, null, 2),
    contentType: 'application/json'
  });

  await test.step('1. Crear usuario', async () => {
    const respuesta = await request.post(`${baseURL}/user`, {
      data: usuario
    });
    const datos = await comprobar(respuesta, 200, 'Crear usuario');
    expect(datos.code).toBe(200);
  });

  await test.step('2. Consultar usuario creado', async () => {
    const respuesta = await request.get(userURL);
    const datos = await comprobar(respuesta, 200, 'Consultar creado');
    expect(datos).toMatchObject(usuario);
  });

  await test.step('3. Actualizar nombre y correo', async () => {
    const respuesta = await request.put(userURL, {
      data: actualizado
    });
    const datos = await comprobar(respuesta, 200, 'Actualizar usuario');
    expect(datos.code).toBe(200);
  });

  await test.step('4. Comprobar los cambios guardados', async () => {
    const respuesta = await request.get(userURL);
    const datos = await comprobar(respuesta, 200, 'Consultar actualizado');
    expect(datos).toMatchObject(actualizado);
  });

  await test.step('5. Eliminar usuario', async () => {
    const respuesta = await request.delete(userURL);
    const datos = await comprobar(respuesta, 200, 'Eliminar usuario');
    expect(datos.message).toBe(username);
  });

  await test.step('6. Comprobar que el usuario ya no existe', async () => {
    const respuesta = await request.get(userURL);
    const datos = await comprobar(respuesta, 404, 'Consultar eliminado');
    expect(datos.message).toBe('User not found');
  });
});