import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../../../models/userModel.js";
import Role from "../../../models/roleModel.js";
import OrganizationMember from "../../../models/organizationMemberModel.js";
import ApiError from "../../../utils/apiError.js";

/* -------------------------------------------------------------------------- */
/*                               Helper functions                             */
/* -------------------------------------------------------------------------- */

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const sanitizeNullableString = (value) => {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
};

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateTemporaryPassword = () => {
  return `Temp@${Math.random().toString(36).slice(-8)}A1`;
};

const buildMemberPopulation = () => [
  {
    path: "user",
    select:
      "_id firstName lastName email phone avatar status isActive organizationId managerId",
  },
  {
    path: "roles",
    select:
      "_id name code description status isDefault isSystem priority accessScope",
  },
  {
    path: "invitedBy",
    select: "_id firstName lastName email",
  },
  {
    path: "createdBy",
    select: "_id firstName lastName email",
  },
  {
    path: "updatedBy",
    select: "_id firstName lastName email",
  },
];

const populateMemberQuery = (query) => {
  const populations = buildMemberPopulation();

  for (const population of populations) {
    query.populate(population);
  }

  return query;
};

/**
 * Get single member of an organization with population
 */
const getMemberByIdForOrganization = async ({
  memberId,
  organizationId,
  session = null,
}) => {
  let query = OrganizationMember.findOne({
    _id: memberId,
    organization: organizationId,
    isDeleted: false,
  });

  if (session) {
    query = query.session(session);
  }

  query = populateMemberQuery(query);

  return query;
};

/**
 * Validate that all role ids belong to the same organization
 */
const validateRoleIdsForOrganization = async ({
  roleIds = [],
  organizationId,
  session = null,
}) => {
  const uniqueRoleIds = [...new Set(roleIds.map(String))];

  if (!uniqueRoleIds.length) {
    throw new ApiError(400, "At least one role is required");
  }

  let query = Role.find({
    _id: { $in: uniqueRoleIds },
    organization: organizationId,
    status: "ACTIVE",
    isDeleted: false,
  }).select("_id name code isDefault isSystem");

  if (session) {
    query = query.session(session);
  }

  const roles = await query;

  if (roles.length !== uniqueRoleIds.length) {
    throw new ApiError(
      400,
      "One or more roles are invalid or do not belong to this organization",
    );
  }

  return roles;
};

/**
 * managerId is OPTIONAL
 * If provided, ensure that manager belongs to the same organization
 */
const validateManagerForOrganization = async ({
  managerId,
  organizationId,
  session = null,
}) => {
  if (!managerId) return null;

  let query = User.findOne({
    _id: managerId,
    organizationId,
    isActive: true,
    status: "ACTIVE",
  }).select("_id firstName lastName email organizationId");

  if (session) {
    query = query.session(session);
  }

  const manager = await query;

  if (!manager) {
    throw new ApiError(400, "Manager not found in current organization");
  }

  return manager;
};

/**
 * Prevent using same email if that user belongs to another organization
 */
const ensureUserCanBelongToOrganization = ({ user, organizationId }) => {
  if (
    user.organizationId &&
    String(user.organizationId) !== String(organizationId)
  ) {
    throw new ApiError(
      409,
      "This user already belongs to another organization",
    );
  }
};

/**
 * Prevent duplicate membership in same organization
 */
const ensureNoDuplicateMembership = async ({
  organizationId,
  userId,
  session = null,
}) => {
  let query = OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
    isDeleted: false,
  }).select("_id");

  if (session) {
    query = query.session(session);
  }

  const existingMembership = await query;

  if (existingMembership) {
    throw new ApiError(409, "User is already a member of this organization");
  }
};

/**
 * Prevent self delete / self suspend / self manager assignment cases where needed
 */
const ensureNotSelfAction = ({ actorUserId, targetUserId, message }) => {
  if (String(actorUserId) === String(targetUserId)) {
    throw new ApiError(400, message);
  }
};

/**
 * Prevent removing/deactivating/deleting the last OWNER in an organization
 */
const ensureNotLastOwnerRemoval = async ({
  organizationId,
  memberId,
  nextRoleIds = null,
  nextStatus = null,
  isDelete = false,
  session = null,
}) => {
  let memberQuery = OrganizationMember.findOne({
    _id: memberId,
    organization: organizationId,
    isDeleted: false,
  }).populate({
    path: "roles",
    select: "_id code name status isDefault isSystem",
  });

  if (session) {
    memberQuery = memberQuery.session(session);
  }

  const member = await memberQuery;

  if (!member) {
    throw new ApiError(404, "Member not found");
  }

  const memberHasOwnerRole = (member.roles || []).some(
    (role) => role?.code === "owner",
  );

  if (!memberHasOwnerRole) {
    return;
  }

  const ownerRoles = await Role.find({
    organization: organizationId,
    code: "owner",
    status: "ACTIVE",
    isDeleted: false,
  })
    .select("_id")
    .session(session);

  const ownerRoleIds = ownerRoles.map((role) => role._id);

  const activeOwnerMembersCount = await OrganizationMember.countDocuments({
    organization: organizationId,
    isDeleted: false,
    status: "ACTIVE",
    roles: { $in: ownerRoleIds },
  }).session(session);

  const actionRemovesOwnerRole =
    Array.isArray(nextRoleIds) &&
    !nextRoleIds.some((roleId) =>
      ownerRoleIds.some(
        (ownerRoleId) => String(ownerRoleId) === String(roleId),
      ),
    );

  const actionMakesInactive =
    nextStatus && ["INACTIVE", "SUSPENDED"].includes(nextStatus);

  if (
    activeOwnerMembersCount <= 1 &&
    (isDelete || actionRemovesOwnerRole || actionMakesInactive)
  ) {
    throw new ApiError(
      400,
      "Cannot remove, deactivate, suspend, or delete the last owner of the organization",
    );
  }
};

const buildListFilter = ({ organizationId, status, roleId }) => {
  const filter = {
    organization: organizationId,
    isDeleted: false,
  };

  if (status) {
    filter.status = status;
  }

  if (roleId) {
    filter.roles = roleId;
  }

  return filter;
};

/* -------------------------------------------------------------------------- */
/*                               List members                                 */
/* -------------------------------------------------------------------------- */

export const listOrganizationMembers = async ({ organizationId, query }) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;

  const search = query.search ? String(query.search).trim() : null;
  const status = query.status || null;
  const roleId = query.roleId || null;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const filter = buildListFilter({
    organizationId,
    status,
    roleId,
  });

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    const matchedUsers = await User.find({
      organizationId,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    }).select("_id");

    const matchedUserIds = matchedUsers.map((user) => user._id);

    filter.$or = [
      { title: searchRegex },
      { department: searchRegex },
      { employeeId: searchRegex },
      {
        user: {
          $in: matchedUserIds.length
            ? matchedUserIds
            : [new mongoose.Types.ObjectId()],
        },
      },
    ];
  }

  const [members, total] = await Promise.all([
    populateMemberQuery(
      OrganizationMember.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
    ),
    OrganizationMember.countDocuments(filter),
  ]);

  return {
    items: members,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                               Invite member                                */
/* -------------------------------------------------------------------------- */

export const inviteOrganizationMember = async ({
  organizationId,
  actorUserId,
  payload,
}) => {
  if (!organizationId) {
    throw new ApiError(400, "Organization id is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const firstName = payload.firstName?.trim();
    const lastName = payload.lastName?.trim();
    const email = normalizeEmail(payload.email);
    const phone = sanitizeNullableString(payload.phone);
    const title = sanitizeNullableString(payload.title);
    const department = sanitizeNullableString(payload.department);
    const employeeId = sanitizeNullableString(payload.employeeId);
    const managerId = payload.managerId || null;
    const roleIds = [...new Set((payload.roles || []).map(String))];

    if (!firstName || !lastName || !email) {
      throw new ApiError(400, "First name, last name and email are required");
    }

    await validateRoleIdsForOrganization({
      roleIds,
      organizationId,
      session,
    });

    await validateManagerForOrganization({
      managerId,
      organizationId,
      session,
    });

    let user = await User.findOne({ email }).session(session);

    if (user) {
      ensureUserCanBelongToOrganization({ user, organizationId });

      await ensureNoDuplicateMembership({
        organizationId,
        userId: user._id,
        session,
      });

      if (!user.organizationId) {
        user.organizationId = organizationId;
      }

      if (managerId !== null) {
        user.managerId = managerId;
      }

      if (phone && !user.phone) {
        user.phone = phone;
      }

      if (!user.firstName) user.firstName = firstName;
      if (!user.lastName) user.lastName = lastName;

      await user.save({ session });
    } else {
      const tempPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      [user] = await User.create(
        [
          {
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            organizationId,
            managerId,
            authProvider: "local",
            isEmailVerified: false,
            status: "ACTIVE",
            isActive: true,
          },
        ],
        { session },
      );
    }

    const inviteToken = generateInviteToken();
    const inviteTokenExpiresAt = getInviteTokenExpiryDate();

    const [member] = await OrganizationMember.create(
      [
        {
          organization: organizationId,
          user: user._id,
          roles: roleIds,
          title,
          department,
          employeeId,
          status: "INVITED",
          invitedBy: actorUserId,
          invitedAt: new Date(),
          acceptedAt: null,
          joinedAt: null,
          inviteToken,
          inviteTokenExpiresAt,
          inviteAcceptedAt: null,
          inviteEmailSentAt: new Date(),
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
      ],
      { session },
    );

    const organization = await Organization.findById(organizationId)
      .select("_id name slug")
      .session(session);

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    const inviter = await User.findById(actorUserId)
      .select("firstName lastName email")
      .session(session);

    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;

    // commit DB transaction first
    await session.commitTransaction();

    // send email after successful DB commit
    try {
      await sendOrganizationInviteEmail({
        email: user.email,
        firstName: user.firstName,
        organizationName: organization.name,
        inviteUrl,
        inviterName: inviter
          ? `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim()
          : "A team member",
      });
    } catch (emailError) {
      // do not fail invite creation because of email transport issue
      console.error("Invite email sending failed:", emailError.message);
    }

    return await getMemberByIdForOrganization({
      memberId: member._id,
      organizationId,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error?.code === 11000) {
      throw new ApiError(409, "Duplicate user or member data detected");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to invite member");
  } finally {
    session.endSession();
  }
};

export const resendOrganizationMemberInvite = async ({
  organizationId,
  actorUserId,
  memberId,
}) => {
  if (!organizationId) {
    throw new ApiError(400, "Organization id is required");
  }

  if (!memberId) {
    throw new ApiError(400, "Member id is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const member = await OrganizationMember.findOne({
      _id: memberId,
      organization: organizationId,
      isDeleted: false,
    })
      .populate({
        path: "user",
        select: "_id firstName lastName email isActive status",
      })
      .session(session)
      .select("+inviteToken");

    if (!member) {
      throw new ApiError(404, "Organization member not found");
    }

    if (member.status !== "INVITED") {
      throw new ApiError(
        400,
        "Invite can only be resent for members in INVITED status",
      );
    }

    if (!member.user) {
      throw new ApiError(404, "User not found for this invited member");
    }

    const organization = await Organization.findById(organizationId)
      .select("_id name slug")
      .session(session);

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    const inviter = await User.findById(actorUserId)
      .select("firstName lastName email")
      .session(session);

    const inviteToken = generateInviteToken();
    const inviteTokenExpiresAt = getInviteTokenExpiryDate();

    member.inviteToken = inviteToken;
    member.inviteTokenExpiresAt = inviteTokenExpiresAt;
    member.inviteEmailSentAt = new Date();
    member.updatedBy = actorUserId;

    await member.save({ session });

    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;

    await session.commitTransaction();

    try {
      await sendOrganizationInviteEmail({
        email: member.user.email,
        firstName: member.user.firstName,
        organizationName: organization.name,
        inviteUrl,
        inviterName: inviter
          ? `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim()
          : "A team member",
      });
    } catch (emailError) {
      console.error("Resend invite email failed:", emailError.message);
    }

    return await getMemberByIdForOrganization({
      memberId: member._id,
      organizationId,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to resend invite");
  } finally {
    session.endSession();
  }
};

/* -------------------------------------------------------------------------- */
/*                          Accept Organization Invite                         */
/* -------------------------------------------------------------------------- */

export const acceptOrganizationInvite = async ({ token, password }) => {
  if (!token) {
    throw new ApiError(400, "Invite token is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const member = await OrganizationMember.findOne({
      inviteToken: token,
      isDeleted: false,
    })
      .select("+inviteToken")
      .session(session);

    if (!member) {
      throw new ApiError(400, "Invalid invite token");
    }

    if (member.status !== "INVITED") {
      throw new ApiError(
        400,
        "This invite has already been used or is inactive",
      );
    }

    if (
      !member.inviteTokenExpiresAt ||
      member.inviteTokenExpiresAt < new Date()
    ) {
      throw new ApiError(400, "Invite token has expired");
    }

    const user = await User.findById(member.user).session(session);

    if (!user) {
      throw new ApiError(404, "User not found for this invite");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.isActive = true;
    user.status = "ACTIVE";
    user.passwordChangedAt = new Date();

    await user.save({ session });

    member.status = "ACTIVE";
    member.acceptedAt = new Date();
    member.joinedAt = new Date();
    member.inviteAcceptedAt = new Date();
    member.inviteToken = null;
    member.inviteTokenExpiresAt = null;

    await member.save({ session });

    await session.commitTransaction();

    return await populateMemberQuery(OrganizationMember.findById(member._id));
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to accept invite");
  } finally {
    session.endSession();
  }
};

/* -------------------------------------------------------------------------- */
/*                               Create member                                */
/* -------------------------------------------------------------------------- */

export const createOrganizationMember = async ({
  organizationId,
  actorUserId,
  payload,
}) => {
  if (!organizationId) {
    throw new ApiError(400, "Organization id is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const firstName = payload.firstName?.trim();
    const lastName = payload.lastName?.trim();
    const email = normalizeEmail(payload.email);
    const password = payload.password;
    const phone = sanitizeNullableString(payload.phone);
    const title = sanitizeNullableString(payload.title);
    const department = sanitizeNullableString(payload.department);
    const employeeId = sanitizeNullableString(payload.employeeId);
    const managerId = payload.managerId || null;
    const roleIds = [...new Set((payload.roles || []).map(String))];

    if (!firstName || !lastName || !email || !password) {
      throw new ApiError(
        400,
        "First name, last name, email and password are required",
      );
    }

    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long");
    }

    await validateRoleIdsForOrganization({
      roleIds,
      organizationId,
      session,
    });

    await validateManagerForOrganization({
      managerId,
      organizationId,
      session,
    });

    let user = await User.findOne({ email }).session(session);

    if (user) {
      ensureUserCanBelongToOrganization({ user, organizationId });

      await ensureNoDuplicateMembership({
        organizationId,
        userId: user._id,
        session,
      });

      if (!user.organizationId) {
        user.organizationId = organizationId;
      }

      if (managerId !== null) {
        user.managerId = managerId;
      }

      if (phone && !user.phone) {
        user.phone = phone;
      }

      if (!user.firstName) user.firstName = firstName;
      if (!user.lastName) user.lastName = lastName;

      /**
       * If user exists but has no password (rare case), allow setting it.
       * If user already has a password, we do not overwrite it from this endpoint.
       */
      if (!user.password) {
        user.password = await bcrypt.hash(password, 12);
      }

      await user.save({ session });
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);

      [user] = await User.create(
        [
          {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            organizationId,
            managerId,
            authProvider: "local",
            isEmailVerified: false,
            status: "ACTIVE",
            isActive: true,
          },
        ],
        { session },
      );
    }

    const [member] = await OrganizationMember.create(
      [
        {
          organization: organizationId,
          user: user._id,
          roles: roleIds,
          title,
          department,
          employeeId,
          status: "ACTIVE",
          joinedAt: new Date(),
          invitedBy: actorUserId,
          invitedAt: new Date(),
          acceptedAt: new Date(),
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return await getMemberByIdForOrganization({
      memberId: member._id,
      organizationId,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error?.code === 11000) {
      throw new ApiError(409, "Duplicate user or member data detected");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to create member");
  } finally {
    session.endSession();
  }
};

/* -------------------------------------------------------------------------- */
/*                            Get member by id                                */
/* -------------------------------------------------------------------------- */

export const getOrganizationMemberById = async ({
  organizationId,
  memberId,
}) => {
  const member = await getMemberByIdForOrganization({
    organizationId,
    memberId,
  });

  if (!member) {
    throw new ApiError(404, "Member not found");
  }

  return member;
};

/* -------------------------------------------------------------------------- */
/*                             Update member info                             */
/* -------------------------------------------------------------------------- */

export const updateOrganizationMember = async ({
  organizationId,
  memberId,
  actorUserId,
  payload,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const member = await OrganizationMember.findOne({
      _id: memberId,
      organization: organizationId,
      isDeleted: false,
    }).session(session);

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    const user = await User.findById(member.user).session(session);

    if (!user) {
      throw new ApiError(404, "User not found for this member");
    }

    if (payload.managerId !== undefined && payload.managerId !== null) {
      await validateManagerForOrganization({
        managerId: payload.managerId,
        organizationId,
        session,
      });

      ensureNotSelfAction({
        actorUserId: payload.managerId,
        targetUserId: user._id,
        message: "User cannot be their own manager",
      });
    }

    /* ------------------------------- update user ------------------------------ */
    if (payload.firstName !== undefined) {
      user.firstName = payload.firstName.trim();
    }

    if (payload.lastName !== undefined) {
      user.lastName = payload.lastName.trim();
    }

    if (payload.phone !== undefined) {
      user.phone = sanitizeNullableString(payload.phone);
    }

    if (payload.managerId !== undefined) {
      user.managerId = payload.managerId || null;
    }

    await user.save({ session });

    /* ------------------------------ update member ----------------------------- */
    if (payload.title !== undefined) {
      member.title = sanitizeNullableString(payload.title);
    }

    if (payload.department !== undefined) {
      member.department = sanitizeNullableString(payload.department);
    }

    if (payload.employeeId !== undefined) {
      member.employeeId = sanitizeNullableString(payload.employeeId);
    }

    member.updatedBy = actorUserId;

    await member.save({ session });

    await session.commitTransaction();

    return await getOrganizationMemberById({
      organizationId,
      memberId,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to update member");
  } finally {
    session.endSession();
  }
};

/* -------------------------------------------------------------------------- */
/*                             Update member roles                            */
/* -------------------------------------------------------------------------- */

export const updateOrganizationMemberRoles = async ({
  organizationId,
  memberId,
  actorUserId,
  payload,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const roleIds = [...new Set((payload.roles || []).map(String))];

    await validateRoleIdsForOrganization({
      roleIds,
      organizationId,
      session,
    });

    await ensureNotLastOwnerRemoval({
      organizationId,
      memberId,
      nextRoleIds: roleIds,
      session,
    });

    const member = await OrganizationMember.findOne({
      _id: memberId,
      organization: organizationId,
      isDeleted: false,
    }).session(session);

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    member.roles = roleIds;
    member.updatedBy = actorUserId;

    await member.save({ session });

    await session.commitTransaction();

    return await getOrganizationMemberById({
      organizationId,
      memberId,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to update member roles");
  } finally {
    session.endSession();
  }
};

/* -------------------------------------------------------------------------- */
/*                            Update member status                            */
/* -------------------------------------------------------------------------- */

export const updateOrganizationMemberStatus = async ({
  organizationId,
  memberId,
  actorUserId,
  payload,
}) => {
  const nextStatus = payload.status;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await ensureNotLastOwnerRemoval({
      organizationId,
      memberId,
      nextStatus,
      session,
    });

    const member = await OrganizationMember.findOne({
      _id: memberId,
      organization: organizationId,
      isDeleted: false,
    }).session(session);

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    const user = await User.findById(member.user).session(session);

    if (!user) {
      throw new ApiError(404, "User not found for this member");
    }

    ensureNotSelfAction({
      actorUserId,
      targetUserId: user._id,
      message:
        "You cannot change your own membership status from this endpoint",
    });

    member.status = nextStatus;
    member.updatedBy = actorUserId;

    if (nextStatus === "ACTIVE" && !member.joinedAt) {
      member.joinedAt = new Date();
    }

    await member.save({ session });

    await session.commitTransaction();

    return await getOrganizationMemberById({
      organizationId,
      memberId,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to update member status");
  } finally {
    session.endSession();
  }
};

/* -------------------------------------------------------------------------- */
/*                              Delete member                                 */
/* -------------------------------------------------------------------------- */

export const deleteOrganizationMember = async ({
  organizationId,
  memberId,
  actorUserId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await ensureNotLastOwnerRemoval({
      organizationId,
      memberId,
      isDelete: true,
      session,
    });

    const member = await OrganizationMember.findOne({
      _id: memberId,
      organization: organizationId,
      isDeleted: false,
    }).session(session);

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    const user = await User.findById(member.user).session(session);

    if (!user) {
      throw new ApiError(404, "User not found for this member");
    }

    ensureNotSelfAction({
      actorUserId,
      targetUserId: user._id,
      message: "You cannot delete your own membership",
    });

    member.isDeleted = true;
    member.deletedAt = new Date();
    member.status = "INACTIVE";
    member.updatedBy = actorUserId;

    await member.save({ session });

    /**
     * If this user has no remaining memberships, clear convenience pointers
     */
    const remainingMembershipCount = await OrganizationMember.countDocuments({
      user: user._id,
      isDeleted: false,
      _id: { $ne: member._id },
    }).session(session);

    if (remainingMembershipCount === 0) {
      user.organizationId = null;
      user.managerId = null;
      await user.save({ session });
    }

    await session.commitTransaction();

    return {
      _id: member._id,
      deleted: true,
    };
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to delete member");
  } finally {
    session.endSession();
  }
};
