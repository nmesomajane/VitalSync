import User from "../models/user.js";


class UserRepository {

  async findByEmail(email) {
   
    const user = await User.findOne({ where: { email } });
   
    return user;
  }

  async findById(id) {

    const user = await User.findByPk(id);
   
    return user;
  }

  async findByGoogleId(googleId) {

    const user = await User.findOne({ where: { googleId } });
    return user;
  }

  async create(userData) {
   
    const user = await User.create(userData);

    return user;
  }

  async updateById(id, updateData) {
   
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update(updateData);
    return user;
  }

}

export default new UserRepository();
