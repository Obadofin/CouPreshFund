const bcrypt = require('bcrypt');
const sequelize = require('../config/database');
const Admin = require('../models/Admin');

const main = async () => {
  const { ADMIN_INITIAL_NAME, ADMIN_INITIAL_EMAIL, ADMIN_INITIAL_PASSWORD } = process.env;
  if (
    typeof ADMIN_INITIAL_NAME !== 'string' || ADMIN_INITIAL_NAME.trim().length < 2
    || typeof ADMIN_INITIAL_EMAIL !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_INITIAL_EMAIL)
    || typeof ADMIN_INITIAL_PASSWORD !== 'string' || ADMIN_INITIAL_PASSWORD.length < 12
  ) {
    throw new Error('Set ADMIN_INITIAL_NAME, ADMIN_INITIAL_EMAIL, and an ADMIN_INITIAL_PASSWORD of at least 12 characters');
  }

  await sequelize.authenticate();
  const existingAdmin = await Admin.findOne({
    where: { email: ADMIN_INITIAL_EMAIL.trim().toLowerCase() },
  });
  if (existingAdmin) {
    throw new Error('An admin account already exists for that email');
  }

  await Admin.create({
    fullName: ADMIN_INITIAL_NAME.trim(),
    email: ADMIN_INITIAL_EMAIL.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(ADMIN_INITIAL_PASSWORD, 12),
    role: 'super_admin',
  });
  process.stdout.write('Initial super-admin account created.\n');
};

main()
  .catch((error) => {
    console.error('Creating initial admin failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    process.env.ADMIN_INITIAL_PASSWORD = '';
    await sequelize.close();
  });
