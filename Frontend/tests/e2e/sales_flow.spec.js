const { test, expect } = require('@playwright/test');

test.describe('E2E-02 y E2E-03: Ciclo de Venta y Fidelización', () => {
  test.beforeEach(async ({ page }) => {
    // Login inicial
    await page.goto('/login');
    await page.getByPlaceholder('admin@cafecito.com').fill('admin@cafecito.com');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*catalogo/);
  });

  test('Debe completar una venta con cliente registrado', async ({ page }) => {
    // 1. Añadir productos (buscamos por el texto exacto del botón)
    const addButtons = page.locator('button:has-text("+ Agregar")');
    
    // Esperar a que carguen los productos (si el catálogo está vacío, esto fallará con un mensaje claro)
    await expect(addButtons.first()).toBeVisible({ timeout: 15000 });
    
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();

    // 2. Abrir Carrito (si no está ya abierto por el sidebar derecho)
    // En el diseño actual, el CarritoSidebar está siempre visible a la derecha en CatalogoPage
    const cartItems = page.locator('.carrito-item');
    await expect(cartItems).toHaveCount(2, { timeout: 10000 });

    // 3. Confirmar Venta
    // El botón tiene un texto dinámico que incluye el precio (ej: "Cobrar $12.50")
    const checkoutBtn = page.locator('button:has-text("Cobrar")');
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    // 4. Verificar que aparece el Ticket (el modal de éxito)
    // El sistema POS abre un TicketModal tras el cobro exitoso
    const ticket = page.locator('.ticket-container');
    await expect(ticket).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.modal-header')).toContainText(/Recibo/i);
    
    // 5. Cerrar Ticket para finalizar
    // Buscamos el botón Cerrar dentro del footer del modal para evitar ambigüedades
    await page.locator('.modal-footer >> button:has-text("Cerrar")').click();
    await expect(ticket).not.toBeVisible();
  });
});
