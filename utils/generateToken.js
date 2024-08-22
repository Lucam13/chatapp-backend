import jwt from "jsonwebtoken";

const generateToken = (UserId, res) => {
	return jwt.sign({ UserId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});
};

export default generateToken;