export default {
  createStudent: [
    { model: 'firstName', required: true },
    { model: 'lastName', required: true },
    { model: 'email', required: false },
  ],
  updateStudent: [
    { model: 'firstName', required: false },
    { model: 'lastName', required: false },
    { model: 'email', required: false },
  ],
  transferStudent: [
    { model: 'id', path: 'studentId', required: true },
  ],
};
