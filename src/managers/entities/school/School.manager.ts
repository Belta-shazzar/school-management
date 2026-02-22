import SchoolModel from './School.mongoModel';

export default class SchoolManager {
  private validators: any;

  public httpExposed: string[];

  constructor({ validators }: any) {
    this.validators = validators;
    this.httpExposed = [
      'post=createSchool',
      'get=getSchool',
      'get=getSchools',
      'put=updateSchool',
      'delete=deleteSchool',
    ];
  }

  /**
   * Create a new school.
   * POST /api/school/createSchool
   * Requires: __token, __superadmin
   */
  async createSchool({
    __token,
    __superadmin,
    name,
    address,
    phone,
    email,
    website,
  }: {
    __token: any;
    __superadmin: any;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
  }) {
    const schoolData = { name, address, phone, email, website };

    // Validate input
    if (this.validators?.school?.createSchool) {
      const validationResult = await this.validators.school.createSchool(schoolData);
      if (validationResult) return validationResult;
    }

    // Check for duplicate school name
    const existing = await SchoolModel.findOne({ name });
    if (existing) {
      return { error: 'A school with this name already exists' };
    }

    const school = await SchoolModel.create(schoolData);
    return school;
  }

  /**
   * Get a single school by ID.
   * GET /api/school/getSchool
   * Requires: __token, __superadmin
   */
  async getSchool({
    __token,
    __superadmin,
    __query,
  }: {
    __token: any;
    __superadmin: any;
    __query: any;
  }) {
    const { id } = __query;
    if (!id) return { error: 'School ID is required' };

    const school = await SchoolModel.findById(id);
    if (!school) return { error: 'School not found' };

    return school;
  }

  /**
   * Get all schools.
   * GET /api/school/getSchools
   * Requires: __token, __superadmin
   */
  async getSchools({
    __token,
    __superadmin,
    __query,
  }: {
    __token: any;
    __superadmin: any;
    __query: any;
  }) {
    const page = parseInt(__query?.page) || 1;
    const limit = parseInt(__query?.limit) || 20;
    const skip = (page - 1) * limit;

    const [schools, total] = await Promise.all([
      SchoolModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      SchoolModel.countDocuments(),
    ]);

    return { schools, total, page, limit };
  }

  /**
   * Update a school.
   * PUT /api/school/updateSchool
   * Requires: __token, __superadmin
   */
  async updateSchool({
    __token,
    __superadmin,
    id,
    name,
    address,
    phone,
    email,
    website,
  }: {
    __token: any;
    __superadmin: any;
    id: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  }) {
    if (!id) return { error: 'School ID is required' };

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;

    // Validate
    if (this.validators?.school?.updateSchool) {
      const validationResult = await this.validators.school.updateSchool(updateData);
      if (validationResult) return validationResult;
    }

    const school = await SchoolModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!school) return { error: 'School not found' };

    return school;
  }

  /**
   * Delete a school.
   * DELETE /api/school/deleteSchool
   * Requires: __token, __superadmin
   */
  async deleteSchool({
    __token,
    __superadmin,
    id,
  }: {
    __token: any;
    __superadmin: any;
    id: string;
  }) {
    if (!id) return { error: 'School ID is required' };

    // TODO: Convert to soft delete.
    const school = await SchoolModel.findByIdAndDelete(id);
    if (!school) return { error: 'School not found' };

    return { message: 'School deleted successfully' };
  }

  static async getSchoolById(schoolId: string) {
    return await SchoolModel.findById(schoolId);
  }
}
