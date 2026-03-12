import express from 'express';
import authRoutes from './authRoutes.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is healthy' });
});

// Authentication routes
router.use('/auth', authRoutes);

// Add your resource routes here
// import userRoutes from './userRoutes.js';
// router.use('/users', userRoutes);

export default router;
