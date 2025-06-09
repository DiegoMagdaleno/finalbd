// hash.js
const bcrypt = require('bcryptjs');

const password = 'secret123';

bcrypt.hash(password, 10).then(hash => {
  console.log('Hash:', hash);
});

