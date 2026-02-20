import StudentModel from './Student.mongoModel';
import ClassroomModel from '../classroom/Classroom.mongoModel';

export default class StudentManager {
  private validators: any;

  public httpExposed: string[];

  constructor({ validators }: any) {
    this.validators = validators;
    this.httpExposed = [
      'post=createStudent',
      'get=getStudent',
      'get=getStudents',
      'put=updateStudent',
      'delete=deleteStudent',
      'put=transferStudent',
    ];
  }

  private _resolveSchoolId(tokenData: any, explicitSchoolId?: string): string | null {
    if (tokenData.role === 'superadmin') {
      return explicitSchoolId || null;
    }
    return tokenData.schoolId || null;
  }

  /**
   * Enroll a new student.
   * POST /api/student/createStudent
   * Requires: __token, __schoolAdmin
   */
  async createStudent({
    __token,
    __schoolAdmin,
    firstName,
    lastName,
    email,
    dateOfBirth,
    classroomId,
    schoolId,
  }: {
    __token: any;
    __schoolAdmin: any;
    firstName: string;
    lastName: string;
    email?: string;
    dateOfBirth?: string;
    classroomId?: string;
    schoolId?: string;
  }) {
    const resolvedSchoolId = this._resolveSchoolId(__token, schoolId);
    if (!resolvedSchoolId) {
      return { error: 'School ID is required. School admins must be assigned to a school.' };
    }

    const studentData = { firstName, lastName, email };

    if (this.validators?.student?.createStudent) {
      const validationResult = await this.validators.student.createStudent(studentData);
      if (validationResult) return validationResult;
    }

    // Validate classroomId belongs to the school if provided
    if (classroomId) {
      const classroom = await ClassroomModel.findById(classroomId);
      if (!classroom || classroom.schoolId.toString() !== resolvedSchoolId) {
        return { error: 'Invalid classroom: classroom not found or does not belong to this school' };
      }
    }

    const student = await StudentModel.create({
      firstName,
      lastName,
      email,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      schoolId: resolvedSchoolId,
      classroomId: classroomId || undefined,
      enrollmentDate: new Date(),
    });

    return student;
  }

  /**
   * Get a single student by ID.
   * GET /api/student/getStudent
   * Requires: __token, __schoolAdmin
   */
  async getStudent({
    __token,
    __schoolAdmin,
    __query,
  }: {
    __token: any;
    __schoolAdmin: any;
    __query: any;
  }) {
    const { id } = __query;
    if (!id) return { error: 'Student ID is required' };

    const student = await StudentModel.findById(id)
      .populate('schoolId')
      .populate('classroomId');
    if (!student) return { error: 'Student not found' };

    // Scope check
    if (
      __token.role === 'school_admin' &&
      student.schoolId.toString() !== __token.schoolId
    ) {
      return { error: 'Forbidden: you can only access your school\'s students' };
    }

    return student;
  }

  /**
   * Get all students (school-scoped for school_admin).
   * GET /api/student/getStudents
   * Requires: __token, __schoolAdmin
   */
  async getStudents({
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
    if (__token.role === 'school_admin') {
      filter.schoolId = __token.schoolId;
    } else if (__query?.schoolId) {
      filter.schoolId = __query.schoolId;
    }

    if (__query?.classroomId) {
      filter.classroomId = __query.classroomId;
    }

    const [students, total] = await Promise.all([
      StudentModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('classroomId'),
      StudentModel.countDocuments(filter),
    ]);

    return { students, total, page, limit };
  }

  /**
   * Update a student's profile.
   * PUT /api/student/updateStudent
   * Requires: __token, __schoolAdmin
   */
  async updateStudent({
    __token,
    __schoolAdmin,
    id,
    firstName,
    lastName,
    email,
    dateOfBirth,
    classroomId,
  }: {
    __token: any;
    __schoolAdmin: any;
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: string;
    classroomId?: string;
  }) {
    if (!id) return { error: 'Student ID is required' };

    const student = await StudentModel.findById(id);
    if (!student) return { error: 'Student not found' };

    // Scope check
    if (
      __token.role === 'school_admin' &&
      student.schoolId.toString() !== __token.schoolId
    ) {
      return { error: 'Forbidden: you can only update your school\'s students' };
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
    if (classroomId !== undefined) updateData.classroomId = classroomId;

    if (this.validators?.student?.updateStudent) {
      const validationResult = await this.validators.student.updateStudent(updateData);
      if (validationResult) return validationResult;
    }

    const updated = await StudentModel.findByIdAndUpdate(id, updateData, { new: true });
    return updated;
  }

  /**
   * Delete a student.
   * DELETE /api/student/deleteStudent
   * Requires: __token, __schoolAdmin
   */
  async deleteStudent({
    __token,
    __schoolAdmin,
    id,
  }: {
    __token: any;
    __schoolAdmin: any;
    id: string;
  }) {
    if (!id) return { error: 'Student ID is required' };

    const student = await StudentModel.findById(id);
    if (!student) return { error: 'Student not found' };

    // Scope check
    if (
      __token.role === 'school_admin' &&
      student.schoolId.toString() !== __token.schoolId
    ) {
      return { error: 'Forbidden: you can only delete your school\'s students' };
    }

    await StudentModel.findByIdAndDelete(id);
    return { message: 'Student deleted successfully' };
  }

  /**
   * Transfer a student to a different school and/or classroom.
   * PUT /api/student/transferStudent
   * Requires: __token, __schoolAdmin
   */
  async transferStudent({
    __token,
    __schoolAdmin,
    studentId,
    newSchoolId,
    newClassroomId,
  }: {
    __token: any;
    __schoolAdmin: any;
    studentId: string;
    newSchoolId?: string;
    newClassroomId?: string;
  }) {
    if (!studentId) return { error: 'Student ID is required' };
    if (!newSchoolId && !newClassroomId) {
      return { error: 'At least one of newSchoolId or newClassroomId is required' };
    }

    const student = await StudentModel.findById(studentId);
    if (!student) return { error: 'Student not found' };

    // Scope check — only superadmin can transfer between schools
    if (__token.role === 'school_admin') {
      if (student.schoolId.toString() !== __token.schoolId) {
        return { error: 'Forbidden: you can only transfer your school\'s students' };
      }
      if (newSchoolId && newSchoolId !== __token.schoolId) {
        return { error: 'Forbidden: school admins cannot transfer students to other schools' };
      }
    }

    const updateData: any = {};
    if (newSchoolId) updateData.schoolId = newSchoolId;
    if (newClassroomId) {
      // Validate classroom belongs to the target school
      const targetSchoolId = newSchoolId || student.schoolId.toString();
      const classroom = await ClassroomModel.findById(newClassroomId);
      if (!classroom || classroom.schoolId.toString() !== targetSchoolId) {
        return { error: 'Invalid classroom: classroom not found or does not belong to the target school' };
      }
      updateData.classroomId = newClassroomId;
    }

    const updated = await StudentModel.findByIdAndUpdate(studentId, updateData, {
      new: true,
    }).populate('schoolId').populate('classroomId');

    return { message: 'Student transferred successfully', student: updated };
  }
}
