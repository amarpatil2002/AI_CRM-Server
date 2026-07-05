import mongoose from "mongoose";
import Organization from "../../models/organizationModel.js";
import OrganizationMember from "../../models/organizationMemberModel.js";
import createDefaultRolesForOrganization from "./createDefaultRolesForOrganization.js";
import ApiError from "../../utils/ApiError.js";

const generateSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const ensureUniqueOrganizationSlug = async (baseSlug, session) => {
  let slug = baseSlug;
  let counter = 1;

  while (
    await Organization.exists({
      slug,
      isDeleted: false,
    }).session(session)
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

export const bootstrapOrganizationForUser = async ({
  user,
  organizationName,
  createdBy = null,
  organizationPayload = {},
}) => {
  if (!user?._id) {
    throw new ApiError(400, "Valid user is required to bootstrap organization");
  }

  if (!organizationName || !organizationName.trim()) {
    throw new ApiError(400, "Organization name is required");
  }

  const existingMembership = await OrganizationMember.findOne({
    user: user._id,
    status: "ACTIVE",
  });

  if (existingMembership) {
    throw new ApiError(409, "User already belongs to an active organization");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const baseSlug = generateSlug(organizationName);

    if (!baseSlug) {
      throw new ApiError(400, "Unable to generate organization slug");
    }

    const slug = await ensureUniqueOrganizationSlug(baseSlug, session);

    const [organization] = await Organization.create(
      [
        {
          name: organizationName.trim(),
          slug,
          owner: user._id,
          email: organizationPayload.email || user.email || null,
          phone: organizationPayload.phone || null,
          website: organizationPayload.website || null,
          industry: organizationPayload.industry || null,
          description: organizationPayload.description || null,
          address: organizationPayload.address || {},
          settings: organizationPayload.settings || {},
          subscription: organizationPayload.subscription || {},
          status: "ACTIVE",
        },
      ],
      { session },
    );

    const { ownerRole, roleMap, roles } =
      await createDefaultRolesForOrganization({
        organizationId: organization._id,
        actorUserId: createdBy || user._id,
        session,
      });

    if (!ownerRole?._id) {
      throw new ApiError(500, "Owner role was not created for organization");
    }

    const [membership] = await OrganizationMember.create(
      [
        {
          organization: organization._id,
          user: user._id,
          roles: [ownerRole._id],
          status: "ACTIVE",
          joinedAt: new Date(),
          acceptedAt: new Date(),
          createdBy: createdBy || user._id,
          updatedBy: createdBy || user._id,
        },
      ],
      { session },
    );

    // optional convenience sync on user doc
    user.organizationId = organization._id;
    user.roleId = ownerRole._id;
    await user.save({ session });

    await session.commitTransaction();

    return {
      organization,
      membership,
      roles,
      roleMap,
      ownerRole,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export default bootstrapOrganizationForUser;
