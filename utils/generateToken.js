import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (UserId, res) => {
	const token = jwt.sign({ UserId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		maxAge: 15 * 24 * 60 * 60 * 1000,
		httpOnly: true,
		sameSite: process.env.NODE_ENV === "development" ? "strict" : "none",
		secure: process.env.NODE_ENV !== "development",
	});
};

export default generateTokenAndSetCookie;