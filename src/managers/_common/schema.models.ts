export default {
  username: {
    path: 'username',
    type: 'string',
    length: { min: 3, max: 20 },
  },
  password: {
    path: 'password',
    type: 'string',
    length: { min: 8, max: 100 },
  },
  email: {
    path: 'email',
    type: 'string',
    length: { min: 3, max: 100 },
    regex:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  name: {
    path: 'name',
    type: 'string',
    length: { min: 2, max: 100 },
  },
  address: {
    path: 'address',
    type: 'string',
    length: { min: 3, max: 300 },
  },
  phone: {
    path: 'phone',
    type: 'string',
    length: { min: 5, max: 20 },
  },
  website: {
    path: 'website',
    type: 'string',
    length: { min: 5, max: 200 },
  },
  firstName: {
    path: 'firstName',
    type: 'string',
    length: { min: 1, max: 50 },
  },
  lastName: {
    path: 'lastName',
    type: 'string',
    length: { min: 1, max: 50 },
  },
  capacity: {
    path: 'capacity',
    type: 'number',
  },
  role: {
    path: 'role',
    type: 'string',
  },
  id: {
    path: 'id',
    type: 'string',
    length: { min: 1, max: 50 },
  },
};
