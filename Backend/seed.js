require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./src/models/Usuario');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafecito-pos';
    await mongoose.connect(mongoUri);
    
    console.log('📦 Conectado a MongoDB...');

    // Verifica si ya existe algún admin
    const adminExistente = await Usuario.findOne({ email: 'admin@cafecito.com' });
    
    if (adminExistente) {
      console.log('⚠️ El usuario admin ya existe.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const nuevoAdmin = new Usuario({
      nombre: 'Administrador Maestro',
      email: 'admin@cafecito.com',
      password: 'admin', // Will be hashed by pre-save hook 
      rol: 'admin',
      activo: true
    });

    // Wait! Since Mongoose hook hashes it, we just set plaintext 'admin123'
    nuevoAdmin.password = 'admin123';
    
    await nuevoAdmin.save();
    console.log('✅ Usuario admin creado exitosamente:');
    console.log('   Email: admin@cafecito.com');
    console.log('   Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al sembrar admin:', error);
    process.exit(1);
  }
};

seedAdmin();
