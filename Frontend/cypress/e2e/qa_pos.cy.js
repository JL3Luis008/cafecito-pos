describe('QA Cafecito POS - Flujos Críticos', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('E2E-01: Debe fallar login con datos incorrectos', () => {
    cy.get('input[type="email"]').type('error@cafecito.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Verificar SweetAlert
    cy.get('.swal2-title').should('contain', 'Error');
  });

  it('E2E-01 y E2E-05: Login exitoso y apertura de perfil', () => {
    // Login
    cy.get('input[type="email"]').type('admin@cafecito.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Verificación de Catalogo
    cy.url().should('include', '/catalogo');
    cy.get('.navbar').should('be.visible');

    // Apertura del Nuevo Perfil (Glassmorphism)
    cy.get('.navbar__user-pill').click();
    cy.get('.profile-card').should('be.visible');
    cy.get('.profile-card__title').should('contain', 'Configuración');
    
    // Cerrar el perfil
    cy.get('.profile-btn--cancel').click();
    cy.get('.profile-card').should('not.exist');
  });

  it('E2E-02: Ciclo de Venta "Happy Path"', () => {
    // Login rápido
    cy.get('input[type="email"]').type('admin@cafecito.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Añadir productos
    cy.get('button').contains('+ Agregar').first().click();
    
    // Intentar agregar un segundo producto solo si existe, sin romper el test
    cy.get('button').then(($btns) => {
      const agregarBtns = $btns.filter((i, el) => el.innerText.includes('+ Agregar'));
      if (agregarBtns.length > 1) {
        cy.wrap(agregarBtns).eq(1).click();
      }
    });

    // Verificar item en el carrito sidebar
    cy.get('.carrito-item', { timeout: 10000 }).should('have.length.at.least', 1);

    // Selección de método de pago (Sprint 1)
    // Usamos regex para ignorar emojis o espacios extra
    cy.get('button').contains(/Efectivo/i).click();
    
    // El campo de monto recibido
    cy.get('.cash-handling input').clear().type('500');

    // Ejecutar el Cobro
    cy.get('button').contains(/Finalizar Venta/i).should('be.enabled').click();

    // Verificar Ticket
    cy.get('.ticket-container').should('be.visible');
    cy.get('.modal-header').should('contain', 'Recibo');
    
    // Verificar que el ticket tenga info de pago y cambio
    cy.get('.ticket-container').should('contain', 'efectivo');
    cy.get('.ticket-container').should('contain', 'Cambio');

    // Finalizar
    cy.get('.modal-footer button').contains('Cerrar').click();
    cy.get('.ticket-container').should('not.exist');
  });
});
