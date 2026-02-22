import ClassroomModel from "./Classroom.mongoModel";
import SchoolManager from "../school/School.manager";

export default class ClassroomManager {
  private validators: any;

  public httpExposed: string[];

  constructor({ validators }: any) {
    this.validators = validators;
    this.httpExposed = [
      "post=createClassroom",
      "get=getClassroom",
      "get=getClassrooms",
      "put=updateClassroom",
      "delete=deleteClassroom",
    ];
  }

  /**
   * Helper: resolve the schoolId for the current user.
   * Superadmins can pass a schoolId explicitly; school_admins use their assigned school.
   */
  private _resolveSchoolId(
    tokenData: any,
    explicitSchoolId?: string,
  ): string | null {
    if (tokenData.role === "superadmin") {
      return explicitSchoolId || null;
    }
    return tokenData.schoolId || null;
  }

  /**
   * Create a new classroom.
   * POST /api/classroom/createClassroom
   * Requires: __token, __schoolAdmin
   */
  async createClassroom({
    __token,
    __schoolAdmin,
    name,
    capacity,
    resources,
    schoolId,
  }: {
    __token: any;
    __schoolAdmin: any;
    name: string;
    capacity: number;
    resources?: string[];
    schoolId?: string;
  }) {
    const resolvedSchoolId = this._resolveSchoolId(__token, schoolId);
    if (!resolvedSchoolId) {
      return {
        error:
          "School ID is required. School admins must be assigned to a school.",
      };
    }

    const classroomData = { name, capacity, resources };

    if (this.validators?.classroom?.createClassroom) {
      const validationResult =
        await this.validators.classroom.createClassroom(classroomData);
      if (validationResult) return validationResult;
    }

    const school = await SchoolManager.getSchoolById(resolvedSchoolId);
    if (!school) return { error: "School not found" };

    // TODO: Add check to prevent creating classrooms with duplicate names within the same school.

    const classroom = await ClassroomModel.create({
      ...classroomData,
      schoolId: resolvedSchoolId,
    });

    return classroom;
  }

  /**
   * Get a single classroom by ID.
   * GET /api/classroom/getClassroom
   * Requires: __token, __schoolAdmin
   */
  async getClassroom({
    __token,
    __schoolAdmin,
    __query,
  }: {
    __token: any;
    __schoolAdmin: any;
    __query: any;
  }) {
    const { id } = __query;
    if (!id) return { error: "Classroom ID is required" };
    
    const classroom = await ClassroomModel.findById(id).populate("schoolId");
    if (!classroom) return { error: "Classroom not found" };

    // Scope check for school_admin.
    // After .populate(), schoolId is a Document — use ._id to get the ObjectId string.
    const classroomSchoolId =
      (classroom.schoolId as any)._id?.toString() ??
      classroom.schoolId.toString();
    if (
      __token.role === "school_admin" &&
      classroomSchoolId !== __token.schoolId
    ) {
      return {
        error: "Forbidden: you can only access your school's classrooms",
      };
    }

    return classroom;
  }

  /**
   * Get all classrooms (school-scoped for school_admin).
   * GET /api/classroom/getClassrooms
   * Requires: __token, __schoolAdmin
   */
  async getClassrooms({
    __token,
    __schoolAdmin,
    __query,
  }: {
    __token: any;
    __schoolAdmin: any;
    __query: any;
  }) {
    const page = parseInt(__query?.page) || 1;
    const limit = parseInt(__query?.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (__token.role === "school_admin") {
      filter.schoolId = __token.schoolId;
    } else if (__query?.schoolId) {
      filter.schoolId = __query.schoolId;
    }

    const [classrooms, total] = await Promise.all([
      ClassroomModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ClassroomModel.countDocuments(filter),
    ]);

    return { classrooms, total, page, limit };
  }

  /**
   * Update a classroom.
   * PUT /api/classroom/updateClassroom
   * Requires: __token, __schoolAdmin
   */
  async updateClassroom({
    __token,
    __schoolAdmin,
    id,
    name,
    capacity,
    resources,
  }: {
    __token: any;
    __schoolAdmin: any;
    id: string;
    name?: string;
    capacity?: number;
    resources?: string[];
  }) {
    if (!id) return { error: "Classroom ID is required" };

    const classroom = await ClassroomModel.findById(id);
    if (!classroom) return { error: "Classroom not found" };

    // Scope check
    if (
      __token.role === "school_admin" &&
      classroom.schoolId.toString() !== __token.schoolId
    ) {
      return {
        error: "Forbidden: you can only update your school's classrooms",
      };
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (resources !== undefined) updateData.resources = resources;

    if (this.validators?.classroom?.updateClassroom) {
      const validationResult =
        await this.validators.classroom.updateClassroom(updateData);
      if (validationResult) return validationResult;
    }

    const updated = await ClassroomModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return updated;
  }

  /**
   * Delete a classroom.
   * DELETE /api/classroom/deleteClassroom
   * Requires: __token, __schoolAdmin
   */
  async deleteClassroom({
    __token,
    __schoolAdmin,
    id,
  }: {
    __token: any;
    __schoolAdmin: any;
    id: string;
  }) {
    if (!id) return { error: "Classroom ID is required" };

    const classroom = await ClassroomModel.findById(id);
    if (!classroom) return { error: "Classroom not found" };

    // Scope check
    if (
      __token.role === "school_admin" &&
      classroom.schoolId.toString() !== __token.schoolId
    ) {
      return {
        error: "Forbidden: you can only delete your school's classrooms",
      };
    }

    await ClassroomModel.findByIdAndDelete(id);
    return { message: "Classroom deleted successfully" };
  }
}
