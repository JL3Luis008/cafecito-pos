describe('Sprint 2: Administración y Control Financiero (Cypress)', () => {

  beforeEach(() => {
    // Login inicial como admin
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@cafecito.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/catalogo');
  });

  it('Historia 8: Ciclo completo de Apertura y Corte de Caja', () => {
    // 1. Navegar a Caja
    cy.get('a').contains('Caja').click();
    cy.get('h1').should('contain', 'Gestión de Caja');

    // 2. Abrir Caja (si está cerrada)
    cy.get('body').then(($body) => {
      if ($body.find('h3:contains("Caja Cerrada")').length > 0) {
        cy.get('input[type="number"]').type('100');
        cy.get('button').contains('Abrir Turno').click();
        cy.get('.swal2-title').should('contain', 'Caja Abierta');
        cy.get('.swal2-confirm').click();
      }
    });

    // 3. Verificar estado abierto
    cy.get('h3').should('contain', 'Cierre de Caja Obligatorio');
    cy.get('.bg-white').should('contain', '$100.00');

    // 4. Realizar Corte
    cy.get('input[placeholder="Suma de billetes y monedas"]').type('100');
    cy.get('textarea').type('Corte verificado desde Cypress');
    cy.get('button').contains('Cerrar Turno').click();
    
    // Confirmar en SweetAlert
    cy.get('.swal2-confirm').click();

    // 5. Verificar cierre
    cy.get('.swal2-title').should('contain', 'Corte Realizado');
    cy.get('.swal2-confirm').click();
    cy.get('h3').should('contain', 'Caja Cerrada');
  });

  it('Historia 3: Creación y Visualización de Promociones', () => {
    // 1. Navegar a Promociones
    cy.get('a').contains('Promociones').click();
    cy.get('h1').should('contain', 'Promociones');

    // 2. Abrir Modal
    cy.get('button').contains('Nueva Promoción').click();
    
    // 3. Llenar Formulario
    const promoName = `Promo Cy ${Date.now()}`;
    cy.get('label').contains('Nombre').parent().find('input').type(promoName);
    cy.get('textarea').type('Descuento creado por Cypress');
    cy.get('select').select('porcentaje');
    cy.get('label').contains('Valor').parent().find('input').type('30');
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    cy.get('input[type="date"]').first().type(today);
    cy.get('input[type="date"]').last().type(tomorrow);

    // 4. Guardar
    cy.get('button').contains('Crear Promoción').click();
    cy.get('.swal2-title').should('contain', 'Éxito');
    cy.get('.swal2-confirm').click();

    // 5. Verificar en la lista
    cy.get('.bg-white').should('contain', promoName);
    cy.get('.bg-white').contains(promoName).parent().should('contain', '30%');
  });

});
