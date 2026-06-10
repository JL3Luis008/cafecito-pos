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

    // 2. Verificar que hay items en el carrito
    const cartItems = page.locator('.carrito-item');
    await expect(cartItems).toHaveCount(2, { timeout: 10000 });

    // 3. Selección de Método de Pago y Cambio (Sprint 1 Final)
    // Seleccionamos Efectivo (debería estar por defecto, pero forzamos el click)
    await page.click('button:has-text("Efectivo")');
    
    // Ingresar monto recibido
    const inputRecibido = page.locator('input[type="number"]');
    await inputRecibido.fill('200'); // Asumiendo que el total es menor
    
    // Verificar que el cambio se calcula (el texto del botón ya no es Cobrar sino Finalizar Venta)
    // Y debería haber un contenedor de cambio
    await expect(page.locator('.cash-handling')).toBeVisible();

    // 4. Confirmar Venta
    const checkoutBtn = page.locator('button:has-text("Finalizar Venta")');
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    // 5. Verificar que aparece el Ticket
    const ticket = page.locator('.ticket-container');
    await expect(ticket).toBeVisible({ timeout: 20000 });
    
    // Verificar que el ticket muestra el método de pago y el cambio
    await expect(ticket).toContainText(/efectivo/i);
    await expect(ticket).toContainText(/cambio/i);
    
    // 6. Cerrar Ticket
    await page.locator('.modal-footer >> button:has-text("Cerrar")').click();
    await expect(ticket).not.toBeVisible();
  });
});
