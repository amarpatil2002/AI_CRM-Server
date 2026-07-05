import Organization from "../../../models/orgnizationModel.js";
import OrganizationMember from "../../../models/organizationMemberModel.js";
import ApiError from "../../../utils/apiError.js";

const normalizeOptionalString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const normalizeOptionalEmail = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim().toLowerCase();
  return normalized.length ? normalized : null;
};

export const getCurrentOrganization = async ({ organizationId }) => {
  if (!organizationId) {
    throw new ApiError(400, "Organization id is required");
  }

  const organization = await Organization.findById(organizationId)
    .populate("owner", "_id firstName lastName email phone avatar status")
    .lean();

  if (!organization || organization.isDeleted) {
    throw new ApiError(404, "Organization not found");
  }

  const memberCount = await OrganizationMember.countDocuments({
    organization: organization._id,
    status: "ACTIVE",
    isDeleted: false,
  });

  return {
    _id: organization._id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo || null,
    email: organization.email,
    phone: organization.phone,
    website: organization.website,
    industry: organization.industry,
    description: organization.description,
    address: organization.address || {},
    settings: organization.settings || {},
    subscription: organization.subscription || {},
    status: organization.status,
    owner: organization.owner
      ? {
          _id: organization.owner._id,
          firstName: organization.owner.firstName,
          lastName: organization.owner.lastName,
          fullName: `${organization.owner.firstName || ""} ${
            organization.owner.lastName || ""
          }`.trim(),
          email: organization.owner.email,
          phone: organization.owner.phone,
          avatar: organization.owner.avatar,
          status: organization.owner.status,
        }
      : null,
    memberCount,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  };
};

export const updateCurrentOrganization = async ({
  organizationId,
  payload,
  actorUserId = null,
}) => {
  if (!organizationId) {
    throw new ApiError(400, "Organization id is required");
  }

  const organization = await Organization.findById(organizationId);

  if (!organization || organization.isDeleted) {
    throw new ApiError(404, "Organization not found");
  }

  const {
    name,
    logo,
    website,
    email,
    phone,
    industry,
    description,
    address,
    settings,
  } = payload || {};

  // top-level fields
  if (name !== undefined) {
    const normalizedName = normalizeOptionalString(name);
    if (!normalizedName) {
      throw new ApiError(400, "Organization name cannot be empty");
    }
    organization.name = normalizedName;
  }

  if (logo !== undefined) {
    organization.logo = normalizeOptionalString(logo);
  }

  if (website !== undefined) {
    organization.website = normalizeOptionalString(website);
  }

  if (email !== undefined) {
    organization.email = normalizeOptionalEmail(email);
  }

  if (phone !== undefined) {
    organization.phone = normalizeOptionalString(phone);
  }

  if (industry !== undefined) {
    organization.industry = normalizeOptionalString(industry);
  }

  if (description !== undefined) {
    organization.description = normalizeOptionalString(description);
  }

  // nested address
  if (address && typeof address === "object") {
    organization.address = {
      ...organization.address,
      ...(address.street !== undefined && {
        street: normalizeOptionalString(address.street),
      }),
      ...(address.city !== undefined && {
        city: normalizeOptionalString(address.city),
      }),
      ...(address.state !== undefined && {
        state: normalizeOptionalString(address.state),
      }),
      ...(address.country !== undefined && {
        country: normalizeOptionalString(address.country),
      }),
      ...(address.zipCode !== undefined && {
        zipCode: normalizeOptionalString(address.zipCode),
      }),
    };
  }

  // nested settings
  if (settings && typeof settings === "object") {
    organization.settings = {
      ...organization.settings,
      ...(settings.timezone !== undefined && {
        timezone: normalizeOptionalString(settings.timezone),
      }),
      ...(settings.language !== undefined && {
        language: normalizeOptionalString(settings.language),
      }),
      ...(settings.currency !== undefined && {
        currency: normalizeOptionalString(settings.currency),
      }),
    };
  }

  await organization.save();

  return getCurrentOrganization({ organizationId: organization._id });
};

export default {
  getCurrentOrganization,
  updateCurrentOrganization,
};
