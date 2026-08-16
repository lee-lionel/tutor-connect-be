const User = require("../models/user.models");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')

/* Only these fields go into the token. Keeping it small means the payload
   stays a claim about who the caller is — role included, so the client can
   no longer decide its own role. */
function createJWT(user) {
  return jwt.sign(
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    process.env.SECRET,
    { expiresIn: "24h" }
  );
}

/* Fields a user is allowed to change about themselves. Anything else in the
   body — role, email, password, feedback — is ignored, so the update route
   cannot be used to escalate a role or write an unhashed password. */
const UPDATABLE_FIELDS = ["experience", "subjects", "levels", "location", "showProfile"];

function pickUpdatableFields(body) {
  return UPDATABLE_FIELDS.reduce((fields, key) => {
    if (body[key] !== undefined) fields[key] = body[key];
    return fields;
  }, {});
}

/* Values from a JSON body can be objects, and Mongoose passes an object such
   as {"$ne": null} straight through as a query operator. Anything used in a
   query has to be confirmed a string first. */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function create(req, res) {
  try {
    const { name, email, password, phoneNumber, role } = req.body;

    if (![name, email, password, phoneNumber, role].every(isNonEmptyString)) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Both are sign-in identifiers, so both have to be unique.
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phoneNumber }],
    });

    if (existing) {
      const field = existing.phoneNumber === phoneNumber ? "phone number" : "email";
      return res.status(409).json({ message: `That ${field} is already registered` });
    }

    const newUser = await User.create({ name, email, password, phoneNumber, role });

    return res.status(201).json({
      token: createJWT(newUser),
      role: newUser.role,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Could not create your account" });
  }
}

async function signIn(req, res) {
  try {
    const { input, password } = req.body;

    // Without this, {"input": {"$ne": null}} is a valid query operator and
    // matches an arbitrary account.
    if (!isNonEmptyString(input) || typeof password !== "string") {
      return res.status(400).json({ message: "Enter your login details" });
    }

    const user = await User.findOne({
      $or: [{ email: input.trim().toLowerCase() }, { phoneNumber: input.trim() }],
    });

    // Same message either way, so this can't be used to discover which
    // emails and phone numbers are registered.
    const match = user && (await bcrypt.compare(password, user.password));
    if (!match) {
      return res.status(401).json({ message: "Incorrect login details" });
    }

    return res.status(200).json({
      token: createJWT(user),
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not sign you in" });
  }
}

async function updateProfile(req, res) {
  try {
    // The id comes from the verified token, not the URL.
    const updatedProfile = await User.findByIdAndUpdate(
      req.user._id,
      pickUpdatableFields(req.body),
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json(updatedProfile);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Could not save your profile" });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Profile not found" });

    const profile = user.toJSON();

    // A contact number is only the owner's to see.
    if (String(user._id) !== String(req.user._id)) {
      delete profile.phoneNumber;
    }

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: "Could not load that profile" });
  }
}

async function listTutors(req, res) {
  try {
    const tutors = await User.find({ role: "tutor", showProfile: true }).select("-phoneNumber");
    return res.status(200).json(tutors);
  } catch (error) {
    return res.status(500).json({ message: "Could not load tutors" });
  }
}

module.exports = {
  create,
  signIn,
  updateProfile,
  getProfile,
  listTutors,
};
