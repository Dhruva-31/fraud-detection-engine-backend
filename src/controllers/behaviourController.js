const { getBehaviorProfileService } = require("../services/behaviourService");

const getBehaviorProfile = async (req, res) => {
  const userId = req.user.userId;
  const profile = await getBehaviorProfileService(userId);
  res.status(200).json({
    message: "Profile Retrieval successful",
    profile,
  });
};

module.exports = {
  getBehaviorProfile
}
