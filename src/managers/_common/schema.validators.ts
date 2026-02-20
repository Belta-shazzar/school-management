export default {
  username: (data: string): boolean => {
    if (data.trim().length < 3) {
      return false;
    }
    return true;
  },
};
