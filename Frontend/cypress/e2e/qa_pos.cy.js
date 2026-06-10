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

    // Añadir primer producto disponible
    cy.get('button').contains('+ Agregar').first().click();
    cy.get('button').contains('+ Agregar').eq(1).click();

    // Verificar item en el carrito sidebar
    cy.get('.carrito-item').should('have.length', 2);

    // Ejecutar el Cobro
    cy.get('button').contains('Cobrar').click();

    // Verificar Ticket
    cy.get('.ticket-container').should('be.visible');
    cy.get('.modal-header').should('contain', 'Recibo');

    // Finalizar
    cy.get('.modal-footer button').contains('Cerrar').click();
    cy.get('.ticket-container').should('not.exist');
  });
});
