export const mockModel = () => ({
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  create: jest.fn().mockResolvedValue({}),
  save: jest.fn().mockResolvedValue({}),
  exec: jest.fn().mockResolvedValue({}),
  updateOne: jest.fn().mockResolvedValue({}),
  deleteOne: jest.fn().mockResolvedValue({}),
});
