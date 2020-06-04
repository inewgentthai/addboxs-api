// npm packages
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

// app imports
const { APIError } = require('../helpers');

// globals
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: String,
    password: String,
    name: String,
    lastname: String,
    email: String,
    confirmed: Boolean,
    blocked: Boolean,
    status: Boolean
  }, 
  { 
    timestamps: true, versionKey: false 
  }
);

userSchema.statics = {
  /**
   * Create a Single New User
   * @param {object} newUser - an instance of User
   * @returns {Promise<User, APIError>}
   */
  async createUser(newUser) {
    const duplicate = await this.findOne({ username: newUser.username });
    if (duplicate) {
      throw new APIError(
        409,
        'User Already Exists',
        `There is already a user with username '${newUser.username}'.`
      );
    }
    const user = await newUser.save();
    return user.toObject();
  },
  /**
   * Delete a single User
   * @param {String} username - the Thing's username
   * @returns {Promise<User, APIError>}
   */
  async deleteUser(username) {
    const deleted = await this.findOneAndRemove({ username });
    if (!deleted) {
      throw new APIError(404, 'User Not Found', `No user '${username}' found.`);
    }
    return deleted.toObject();
  },
  /**
   * Get a single User by name
   * @param {String} username - the Thing's username
   * @returns {Promise<User, APIError>}
   */
  async readUser(_id) {
    // const user = await this.findOne({ username });
    const user = await this.findOne({ _id: ObjectId(_id) });
    if (!user) {
      throw new APIError(404, 'User Not Found', `No user id '${_id}' found.`);
    }
    return user.toObject();
  },
  /**
   * Get a list of Users
   * @param {Object} query - pre-formatted query to retrieve users.
   * @param {Object} fields - a list of fields to select or not in object form
   * @param {String} skip - number of docs to skip (for pagination)
   * @param {String} limit - number of docs to limit by (for pagination)
   * @returns {Promise<Users, APIError>}
   */
  async readUsers(query, fields, skip, limit) {
    const users = await this.find(query, fields)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .exec();
    if (!users.length) {
      return [];
    }
    return users.map(user => user.toObject());
  },
  /**
   * Patch/Update a single User
   * @param {String} username - the User's username
   * @param {Object} userUpdate - the json containing the User attributes
   * @returns {Promise<User, APIError>}
   */
  async updateUser(username, userUpdate) {
    const user = await this.findOneAndUpdate({ username }, userUpdate, {
      new: true
    });
    if (!user) {
      throw new APIError(404, 'User Not Found', `No user '${username}' found.`);
    }
    return user.toObject();
  }
};

/* Transform with .toObject to remove __v and _id from response */
if (!userSchema.options.toObject) userSchema.options.toObject = {};
userSchema.options.toObject.transform = (doc, ret) => {
  const transformed = ret;
  transformed.id = transformed._id;
  delete transformed._id;
  delete transformed.__v;
  return transformed;
};

/** Ensure MongoDB Indices **/
userSchema.index({ username: 1 }, { unique: true }); // example compound idx

module.exports = mongoose.model('User', userSchema);
