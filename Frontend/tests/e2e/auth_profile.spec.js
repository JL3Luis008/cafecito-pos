const { test, expect } = require('@playwright/test');

test.describe('E2E-01: Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.getByPlaceholder('admin@cafecito.com').fill('wrong@test.com');
    await page.getByPlaceholder('••••••••').fill('wrongpass');
    await page.click('button[type="submit"]');

    // Esperar a que aparezca SweetAlert o el mensaje de error
    const swalTitle = page.locator('.swal2-title');
    await expect(swalTitle).toBeVisible({ timeout: 10000 });
    await expect(swalTitle).toContainText(/Error/i);
  });

  test('Debe iniciar sesión exitosamente con admin', async ({ page }) => {
    await page.getByPlaceholder('admin@cafecito.com').fill('admin@cafecito.com');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');

    // Verificar que redirige al catálogo y muestra el navbar
    await expect(page).toHaveURL(/.*catalogo/, { timeout: 15000 });
    await expect(page.locator('.navbar')).toBeVisible();
  });
});

test.describe('E2E-05: Perfil de Usuario (Nuevo)', () => {
  test('Debe abrir el modal de perfil y mostrar datos correctos', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.getByPlaceholder('admin@cafecito.com').fill('admin@cafecito.com');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');
    
    // Clic en la "User Pill" del navbar
    const userPill = page.locator('.navbar__user-pill');
    await expect(userPill).toBeVisible({ timeout: 15000 });
    await userPill.click();
    
    // Verificar modal
    const modal = page.locator('.profile-card');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Configuración de Cuenta/i);
    
    // El input de nombre debe tener el valor actual
    const nameInput = modal.locator('input[type="text"]');
    await expect(nameInput).toHaveValue(/Admin/i);
    
    // Cerrar modal
    await page.click('.profile-btn--cancel');
    await expect(modal).not.toBeVisible();
  });
});
