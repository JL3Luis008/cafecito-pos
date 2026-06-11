const { test, expect } = require('@playwright/test');

test.describe('Sprint 2: Administración y Control Financiero', () => {

  test.beforeEach(async ({ page }) => {
    // Login inicial como admin
    await page.goto('/login');
    await page.getByPlaceholder('admin@cafecito.com').fill('admin@cafecito.com');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*catalogo/);
  });

  test('Historia 8: Ciclo completo de Apertura y Corte de Caja', async ({ page }) => {
    // 1. Navegar a Caja
    await page.click('a:has-text("Caja")');
    await expect(page.locator('h1')).toContainText('Gestión de Caja');

    // 2. Abrir Caja (si está cerrada)
    const isClosed = await page.locator('h3:has-text("Caja Cerrada")').isVisible();
    if (isClosed) {
      await page.locator('input[type="number"]').fill('100'); // Monto inicial
      await page.click('button:has-text("Abrir Turno")');
      await expect(page.locator('.swal2-title')).toContainText('Caja Abierta');
      await page.click('.swal2-confirm');
    }

    // 3. Verificar estado abierto
    await expect(page.locator('h3:has-text("Cierre de Caja Obligatorio")')).toBeVisible();
    await expect(page.locator('div.bg-white:has-text("Monto Inicial:")')).toContainText('$100.00');

    // 4. Realizar Corte
    const inputArqueo = page.locator('input[placeholder="Suma de billetes y monedas"]');
    await inputArqueo.fill('100'); 
    await page.locator('textarea').fill('Test de corte automático');
    
    await page.click('button:has-text("Cerrar Turno")');
    await page.click('.swal2-confirm');

    // 5. Verificar que regresó al estado cerrado
    await page.click('.swal2-confirm');
    await expect(page.locator('h3:has-text("Caja Cerrada")')).toBeVisible();
  });

  test('Historia 3: Creación y Visualización de Promociones', async ({ page }) => {
    await page.click('a:has-text("Promociones")');
    await expect(page.locator('h1')).toContainText('Promociones');

    await page.click('button:has-text("Nueva Promoción")');
    
    const promoName = `Promo Test ${Date.now()}`;
    await page.locator('input').first().fill(promoName);
    await page.locator('textarea').fill('Descuento de prueba para E2E');
    await page.locator('select').selectOption('porcentaje');
    await page.locator('input').nth(1).fill('25'); 
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await page.locator('input[type="date"]').first().fill(today);
    await page.locator('input[type="date"]').nth(1).fill(tomorrow);

    await page.click('button:has-text("Crear Promoción")');
    await page.click('.swal2-confirm');

    // 5. Verificar que la promoción específica sea visible
    const promoCard = page.locator(`.bg-white:has-text("${promoName}")`);
    await expect(promoCard).toBeVisible();
    await expect(promoCard).toContainText('25%');
  });

});
