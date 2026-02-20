export default {
  register: [
    { model: 'username', required: true },
    { model: 'email', required: true },
    { model: 'password', required: true },
    { model: 'role', required: false },
  ],
  login: [
    { model: 'email', required: true },
    { model: 'password', required: true },
  ],
};
