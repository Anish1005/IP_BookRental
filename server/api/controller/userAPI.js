const passport = require("passport");
const userSchema = require("../models/user");
const bcrypt = require("bcryptjs");
const genUID = require("./generateUID");
const { checkvalidation } = require("./checkValid");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rakshit.honey602@gmail.com', // Replace with your email
        pass: '18111198920', // Use your Gmail app password here
    }
});

// Fetch all users
exports.allUser = async (req, res) => {
    try {
        const users = await userSchema.find();
        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
};

// Register user with email verification
exports.registerUser = async (req, res) => {
    try {
        const { name, username, password, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const userType = "user";
        const uniqueId = genUID();

        // Validate input
        const check = checkvalidation(req.body);
        if (check.status === 400) {
            return res.status(202).json({ msg: check.message });
        }

        // Check if user exists
        let existingUser = await userSchema.findOne({ username });
        if (!existingUser) {
            // Create new user
            const user = new userSchema({
                name,
                username,
                password: hashedPassword,
                userType,
                phone,
                uniqueId,
                isVerified: false, // Flag for email verification
            });

            // Generate JWT token for email verification
            const verificationToken = jwt.sign({ username }, "your_jwt_secret", { expiresIn: '1d' });

            // Send email verification link
            const verificationLink = `http://localhost:5000/api/users/verify/${verificationToken}`;
            await transporter.sendMail({
                from: 'rakshit.honey602@gmail.com',
                to: username,
                subject: 'Email Verification',
                html: `<p>Please click <a href="${verificationLink}">here</a> to verify your email.</p>`,
            });

            // Save user in database
            await user.save();
            return res.status(201).json({ msg: 'Registration successful. Please check your email for verification.' });
        } else {
            return res.status(202).json({ msg: "User already exists" });
        }
    } catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', error });
    }
};

// Verify email
exports.verifyUser = async (req, res) => {
    try {
        const { token } = req.params;

        // Decode and verify the JWT token
        const decoded = jwt.verify(token, "$%^R1U5fG8!w9y7@#s$J3h5^o8T5aS8L0p2Q4x9U7@pE3v9Q");

        // Find user by the decoded username
        const user = await userSchema.findOne({ username: decoded.username });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Mark user as verified
        user.isVerified = true;
        await user.save();

        return res.status(200).json({ msg: 'Email verified successfully!' });
    } catch (error) {
        return res.status(500).json({ msg: 'Invalid or expired token', error });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { name, username, uniqueId, phone, address } = req.body;

        // Find user by uniqueId
        const user = await userSchema.findOne({ uniqueId });
        if (!user) {
            return res.status(202).json({ msg: "User not found" });
        }

        // Update user details
        user.name = name;
        user.username = username;
        user.phone = phone;
        user.address = address;

        // Save changes
        await user.save();

        return res.status(200).json({ msg: "User information updated successfully" });
    } catch (error) {
        return res.status(500).json({ msg: "Internal server error" });
    }
};

// Login user (only if verified)
exports.loginUser = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return res.send({ status: "500", msg: "Try Again Later" });
        if (!user) return res.status(202).json({ msg: 'Incorrect credentials' });
        if (!user.isVerified) {
            return res.status(401).json({ msg: 'Please verify your email before logging in.' });
        }

        req.logIn(user, (err) => {
            if (err) throw err;
            return res.status(200).json({ msg: 'Authenticated successfully' });
        });
    })(req, res, next);
};

// Get user details
exports.userDetails = (req, res) => {
    res.send(req.user);
    console.log(req.user);
};

// Logout user
exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.status(200).json({ msg: "Logged Out" });
    });
};

// Get a specific user by uniqueId
exports.userDetail = async (req, res) => {
    const uniqueId = req.params.id;

    try {
        const user = await userSchema.findOne({ uniqueId });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
};
