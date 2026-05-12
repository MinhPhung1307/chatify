import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import cloudinary from "../lib/cloudinary.js";
import { ENV } from "../lib/env.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password){
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6){
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        //check if email valid: regex   
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    
        if (!emailRegex.test(email)){
            return res.status(400).json({ message: 'Invalid email format' });
        };

        const user = await User.findOne({ email });
        if (user){
            return res.status(400).json({ message: 'Email already exists' });
        }

        // create hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create new user
        const savedUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
        });

        if (savedUser) {
            generateToken(savedUser.id, res);

            res.status(201).json({
                _id: savedUser.id,
                fullName: savedUser.fullName,
                email: savedUser.email,
                profilePic: savedUser.profilePic,
            });

            // send a welcome email to user
            try {
                await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
            } catch (error) {
                console.log('Failed to send welcome email:', error);
            }

        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.log('Error in signup controller:', error);
        return res.status(500).json({ message: 'Internal Server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password){
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

        generateToken(user.id, res);

        res.status(200).json({
            _id: user.id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.error('Error in login controller:', error);
        res.status(500).json({ message: 'Internal Server error' });
    }
};

export const logout = (_, res) => {
    res.clearCookie('jwt', {
        sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: ENV.NODE_ENV === 'production',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        if (!profilePic) return res.status(400).json({ message: 'Profile picture is required' });

        const userId = req.user._id;

        const uploadResponse = await cloudinary.uploader.upload(profilePic)

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { profilePic: uploadResponse.secure_url }, 
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.log('Error in update profile:', error);
        res.status(500).json({ message: 'Internal Server error' });
    }   
};