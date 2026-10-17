const { test, expect } = require('@playwright/test');

test('Comprar dos productos como invitado en OpenCart', async ({
  page
}, testInfo) => {
  test.setTimeout(120000);

  const baseURL = 'http://opencart.abstracta.us/';

  const productos = [
    { id: 28, nombre: 'HTC Touch HD' },
    { id: 30, nombre: 'Canon EOS 5D', color: 'Red' }
  ];

  async function guardarCaptura(nombre) {
    await testInfo.attach(nombre, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  }

  await test.step('1. Agregar dos productos diferentes', async () => {
    for (const [indice, producto] of productos.entries()) {
      await page.goto(
        `${baseURL}index.php?route=product/product&product_id=${producto.id}`,
        { waitUntil: 'domcontentloaded' }
      );

      await expect(page.locator('#content h1')).toHaveText(
        producto.nombre
      );

      if (producto.color) {
        await page.locator('#product select').selectOption({
          label: producto.color
        });
      }

      await page.locator('#input-quantity').fill('1');
      await page.locator('#button-cart').click();

      await expect(page.locator('#cart-total')).toContainText(
        `${indice + 1} item(s)`,
        { timeout: 15000 }
      );
    }
  });

  await test.step('2. Visualizar y validar el carrito', async () => {
    await page.locator('#cart > button').click();

    await page.locator('#cart').getByRole('link', {
      name: /View Cart/
    }).click();

    // Se valida la URL porque el sitio muestra un título incorrecto.
    await expect(page).toHaveURL(
      /route=checkout(?:\/|%2F)cart/
    );

    await expect(
      page.locator('#content form .table-responsive')
    ).toBeVisible({ timeout: 15000 });

    await guardarCaptura('Carrito y titulo observado');

    const filas = page.locator(
      '#content form .table-responsive tbody tr'
    );

    await expect(filas).toHaveCount(2);

    for (const producto of productos) {
      const fila = filas.filter({
        hasText: producto.nombre
      });

      await expect(fila).toHaveCount(1);

      await expect(
        fila.locator('input[name^="quantity"]')
      ).toHaveValue('1');

      if (producto.color) {
        await expect(fila).toContainText(producto.color);
      }
    }

    await expect(
      page.locator('#content .alert-danger')
    ).toHaveCount(0);

    await page.locator('#content').getByRole('link', {
      name: 'Checkout',
      exact: true
    }).click();
  });

  await test.step('3. Completar datos como invitado', async () => {
    await page.getByRole('radio', {
      name: 'Guest Checkout',
      exact: true
    }).check();

    await page.locator('#button-account').click();

    await page.locator('#input-payment-firstname')
      .fill('Gigi');

    await page.locator('#input-payment-lastname')
      .fill('Pruebas');

    await page.locator('#input-payment-email')
      .fill('gigi.qa@example.com');

    await page.locator('#input-payment-telephone')
      .fill('0000000000');

    await page.locator('#input-payment-address-1')
      .fill('Direccion de prueba 123');

    await page.locator('#input-payment-city')
      .fill('Guayaquil');

    await page.locator('#input-payment-postcode')
      .fill('090150');

    await page.locator('#input-payment-country')
      .selectOption('62');

    await page.locator('#input-payment-zone')
      .selectOption('988');

    await page.locator('#button-guest').click();
  });

  await test.step('4. Completar envio y confirmar pedido', async () => {
    await page.locator(
      '#button-shipping-method:visible, #button-payment-method:visible'
    ).first().waitFor({
      state: 'visible',
      timeout: 20000
    });

    if (await page.locator('#button-shipping-method').isVisible()) {
      await page.locator(
        '#collapse-shipping-method input[type="radio"]'
      ).first().check();

      await page.locator('#button-shipping-method').click();
    }

    await expect(
      page.locator('#button-payment-method')
    ).toBeVisible({ timeout: 15000 });

    await page.locator('#collapse-payment-method').getByRole(
      'radio',
      { name: 'Cash On Delivery', exact: true }
    ).check();

    await page.locator(
      '#collapse-payment-method input[name="agree"]'
    ).check();

    await page.locator('#button-payment-method').click();

    const confirmacion = page.locator(
      '#collapse-checkout-confirm'
    );

    const confirmar = confirmacion.getByRole('button', {
      name: 'Confirm Order'
    });

    await expect(confirmar).toBeVisible({
      timeout: 15000
    });

    for (const producto of productos) {
      await expect(confirmacion).toContainText(
        producto.nombre
      );
    }

    await guardarCaptura('Pedido con los dos productos');

    await confirmar.click();
  });

  await test.step('5. Validar confirmacion de compra', async () => {
    await expect(page.getByRole('heading', {
      name: 'Your order has been placed!',
      exact: true
    })).toBeVisible({ timeout: 20000 });

    await expect(page.getByText(
      'Your order has been successfully processed!',
      { exact: true }
    )).toBeVisible();

    await guardarCaptura('Compra confirmada');
  });
});