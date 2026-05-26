const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'El email no tiene un formato válido'],
    },
    password: {
      type: String,
      required: [true, 'El password es obligatorio'],
      minlength: [6, 'El password debe tener al menos 6 caracteres'],
      select: false,
    },
    rol: {
      type: String,
      enum: ['admin', 'cajero'],
      default: 'cajero',
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UsuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UsuarioSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to exclude password from JSON responses
UsuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Usuario', UsuarioSchema);
